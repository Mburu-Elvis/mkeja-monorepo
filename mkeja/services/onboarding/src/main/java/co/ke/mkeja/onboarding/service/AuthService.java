package co.ke.mkeja.onboarding.service;

import co.ke.mkeja.onboarding.dto.request.LoginRequest;
import co.ke.mkeja.onboarding.dto.request.RegisterRequest;
import co.ke.mkeja.onboarding.dto.request.ResendOtpRequest;
import co.ke.mkeja.onboarding.dto.request.VerifyOtpRequest;
import co.ke.mkeja.onboarding.dto.response.AuthResponse;
import co.ke.mkeja.onboarding.dto.response.UserResponse;
import co.ke.mkeja.onboarding.exception.BadRequestException;
import co.ke.mkeja.onboarding.model.entity.Tenant;
import co.ke.mkeja.onboarding.model.entity.User;
import co.ke.mkeja.onboarding.model.enums.KycStatus;
import co.ke.mkeja.onboarding.model.enums.RoleName;
import co.ke.mkeja.onboarding.repository.AgentRepository;
import co.ke.mkeja.onboarding.repository.PropertyOwnerRepository;
import co.ke.mkeja.onboarding.repository.TenantRepository;
import co.ke.mkeja.onboarding.repository.UserRepository;
import co.ke.mkeja.onboarding.security.jwt.JwtProvider;
import co.ke.mkeja.onboarding.util.UserFieldNormalizer;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final TenantRepository tenantRepository;
    private final PropertyOwnerRepository propertyOwnerRepository;
    private final AgentRepository agentRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtProvider jwtProvider;
    private final RoleService roleService;
    private final OtpService otpService;

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (!request.getPin().equals(request.getConfirmPin())) {
            throw new BadRequestException("PIN and confirm PIN do not match");
        }
        if (userRepository.existsByPhone(UserFieldNormalizer.normalizePhone(request.getPhone()))) {
            throw new BadRequestException("Phone number already registered");
        }

        RoleName roleName = RoleName.fromRegistrationRole(request.getRole());
        if (roleName == RoleName.PROPERTY_OWNER) {
            throw new BadRequestException("Property owners must register via the KYC onboarding flow");
        }
        if (roleName.isAdminRole()) {
            throw new BadRequestException("Admin accounts can only be created by a super admin");
        }

        User user = new User();
        user.setPhone(UserFieldNormalizer.normalizePhone(request.getPhone()));
        user.setEmail(UserFieldNormalizer.normalizeEmail(request.getEmail()));
        splitName(user, request.getFullName());
        user.setPasswordHash(passwordEncoder.encode(request.getPin()));
        user.setPasswordChangedAt(LocalDateTime.now());
        user.setOtpVerified(false);
        user.setCreatedBy("system");
        user.setUpdatedBy("system");
        roleService.grantRole(user, roleName, "system");

        user = userRepository.save(user);

        if (roleName == RoleName.TENANT) {
            Tenant tenant = new Tenant();
            tenant.setUser(user);
            tenant.setNationalId(request.getIdNumber());
            tenant.setKycStatus(KycStatus.PENDING);
            tenant.setWalletId("wallet-" + user.getId());
            tenantRepository.save(tenant);
        }

        return otpService.issueFirstLoginChallenge(user);
    }

    @Transactional
    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByPhone(UserFieldNormalizer.normalizePhone(request.getPhone()))
                .orElseThrow(() -> new BadRequestException("Invalid credentials"));

        if (!user.isActive()) {
            throw new BadRequestException("Account is suspended");
        }
        if (!passwordEncoder.matches(request.getPin(), user.getPasswordHash())) {
            throw new BadRequestException("Invalid credentials");
        }

        if (!user.isOtpVerified()) {
            return otpService.issueFirstLoginChallenge(user);
        }

        user.setLastLoginAt(LocalDateTime.now());
        userRepository.save(user);
        return buildAuthResponse(user, resolveKycStatus(user));
    }

    @Transactional
    public AuthResponse verifyOtp(VerifyOtpRequest request) {
        User user = otpService.verifyFirstLoginOtp(
                request.getChallengeId(),
                request.getPhone(),
                request.getOtp());

        user.setOtpVerified(true);
        user.setLastLoginAt(LocalDateTime.now());
        userRepository.save(user);

        return buildAuthResponse(user, resolveKycStatus(user));
    }

    @Transactional
    public AuthResponse resendOtp(ResendOtpRequest request) {
        return otpService.resendChallenge(request.getChallengeId(), request.getPhone());
    }

    @Transactional(readOnly = true)
    public AuthResponse refresh(User user) {
        if (!user.isOtpVerified()) {
            return otpService.issueFirstLoginChallenge(user);
        }
        return buildAuthResponse(user, resolveKycStatus(user));
    }

    private AuthResponse buildAuthResponse(User user, KycStatus kycStatus) {
        Authentication authentication = new UsernamePasswordAuthenticationToken(user, null, user.getAuthorities());
        String accessToken = jwtProvider.generateToken(authentication);
        String refreshToken = jwtProvider.generateRefreshToken(user);
        UserResponse userResponse = UserResponse.builder()
                .id(String.valueOf(user.getId()))
                .fullName(user.getFullName())
                .phone(user.getPhone())
                .email(user.getEmail())
                .role(roleService.toFrontendRole(user))
                .kycStatus(co.ke.mkeja.onboarding.mapper.EntityMapper.toFrontendKycStatus(kycStatus))
                .createdAt(user.getCreatedAt())
                .build();

        return AuthResponse.builder()
                .otpRequired(false)
                .access_token(accessToken)
                .refresh_token(refreshToken)
                .token_type("Bearer")
                .expires_in(900L)
                .user(userResponse)
                .build();
    }

    private KycStatus resolveKycStatus(User user) {
        return switch (user.getUserType()) {
            case TENANT -> tenantRepository.findByUserId(user.getId())
                    .map(Tenant::getKycStatus)
                    .orElse(KycStatus.PENDING);
            case PROPERTY_OWNER -> propertyOwnerRepository.findByUserId(user.getId())
                    .map(po -> po.getKycStatus())
                    .orElse(KycStatus.PENDING);
            case AGENT -> agentRepository.findByUserId(user.getId())
                    .map(agent -> agent.getKycStatus())
                    .orElse(KycStatus.PENDING);
            default -> KycStatus.APPROVED;
        };
    }

    private void splitName(User user, String fullName) {
        String[] parts = fullName.trim().split("\\s+", 2);
        user.setFirstName(parts[0]);
        user.setLastName(parts.length > 1 ? parts[1] : "");
    }
}

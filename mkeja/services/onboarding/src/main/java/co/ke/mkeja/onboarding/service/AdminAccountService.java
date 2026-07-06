package co.ke.mkeja.onboarding.service;

import co.ke.mkeja.onboarding.dto.request.CreateAdminRequest;
import co.ke.mkeja.onboarding.dto.response.AdminAccountResponse;
import co.ke.mkeja.onboarding.exception.BadRequestException;
import co.ke.mkeja.onboarding.model.entity.User;
import co.ke.mkeja.onboarding.model.enums.RoleName;
import co.ke.mkeja.onboarding.repository.UserRepository;
import co.ke.mkeja.onboarding.util.UserFieldNormalizer;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AdminAccountService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final RoleService roleService;

    @Transactional
    public AdminAccountResponse createAdmin(CreateAdminRequest request, User createdBy) {
        String phone = UserFieldNormalizer.normalizePhone(request.getPhone());
        String email = UserFieldNormalizer.normalizeEmail(request.getEmail());

        if (email == null || email.isBlank()) {
            throw new BadRequestException("Admin email is required");
        }
        if (userRepository.existsByPhone(phone)) {
            throw new BadRequestException("Phone number already registered");
        }
        if (userRepository.existsByEmail(email)) {
            throw new BadRequestException("Email already registered");
        }

        User admin = new User();
        admin.setPhone(phone);
        admin.setEmail(email);
        splitName(admin, request.getFullName());
        admin.setPasswordHash(passwordEncoder.encode(request.getPin()));
        admin.setPasswordChangedAt(LocalDateTime.now());
        admin.setOtpVerified(false);
        admin.setCreatedBy(String.valueOf(createdBy.getId()));
        admin.setUpdatedBy(String.valueOf(createdBy.getId()));
        roleService.grantRole(admin, RoleName.ADMIN, String.valueOf(createdBy.getId()));

        admin = userRepository.save(admin);
        return toResponse(admin);
    }

    @Transactional(readOnly = true)
    public List<AdminAccountResponse> listAdmins() {
        return userRepository.findAll().stream()
                .filter(roleService::isAdmin)
                .filter(user -> !roleService.isSuperAdmin(user))
                .sorted(Comparator.comparing(User::getCreatedAt, Comparator.nullsLast(Comparator.reverseOrder())))
                .map(this::toResponse)
                .toList();
    }

    private AdminAccountResponse toResponse(User user) {
        return AdminAccountResponse.builder()
                .id(String.valueOf(user.getId()))
                .fullName(user.getFullName())
                .phone(user.getPhone())
                .email(user.getEmail())
                .role(roleService.toFrontendRole(user))
                .status(user.isActive() ? "active" : "suspended")
                .createdAt(user.getCreatedAt() != null ? user.getCreatedAt().toString() : null)
                .build();
    }

    private void splitName(User user, String fullName) {
        String[] parts = fullName.trim().split("\\s+", 2);
        user.setFirstName(parts[0]);
        user.setLastName(parts.length > 1 ? parts[1] : "");
    }
}

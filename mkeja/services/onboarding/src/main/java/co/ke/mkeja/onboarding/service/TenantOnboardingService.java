package co.ke.mkeja.onboarding.service;

import co.ke.mkeja.onboarding.dto.request.PaymentPlanRequest;
import co.ke.mkeja.onboarding.dto.request.TenantRegisterRequest;
import co.ke.mkeja.onboarding.dto.response.KycDocumentUploadResponse;
import co.ke.mkeja.onboarding.dto.response.LeaseSummaryResponse;
import co.ke.mkeja.onboarding.dto.response.TenantOnboardingContextResponse;
import co.ke.mkeja.onboarding.dto.response.TenantProfileResponse;
import co.ke.mkeja.onboarding.dto.response.TenantRegisterResponse;
import co.ke.mkeja.onboarding.dto.response.TenancyCreationResponse;
import co.ke.mkeja.onboarding.event.EventPublisher;
import co.ke.mkeja.onboarding.event.OnboardingEvent;
import co.ke.mkeja.onboarding.event.OnboardingEventType;
import co.ke.mkeja.onboarding.exception.ResourceNotFoundException;
import co.ke.mkeja.onboarding.mapper.EntityMapper;
import co.ke.mkeja.onboarding.model.entity.*;
import co.ke.mkeja.onboarding.model.enums.*;
import co.ke.mkeja.onboarding.repository.*;
import co.ke.mkeja.onboarding.util.UserFieldNormalizer;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Locale;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class TenantOnboardingService {

    private final InvitationService invitationService;
    private final TenancyCreationService tenancyCreationService;
    private final UserRepository userRepository;
    private final TenantRepository tenantRepository;
    private final TenancyRepository tenancyRepository;
    private final OnboardingSessionRepository onboardingSessionRepository;
    private final PasswordEncoder passwordEncoder;
    private final KycService kycService;
    private final PaymentService paymentService;
    private final EventPublisher eventPublisher;
    private final RoleService roleService;

    @Transactional
    public TenantRegisterResponse register(TenantRegisterRequest request) {
        TenantInvitation invitation = invitationService.findValidInvitation(request.getInvitationCode());
        String phone = UserFieldNormalizer.normalizePhone(request.getPhone());

        User user = userRepository.findByPhone(phone).orElseGet(() -> {
            User u = new User();
            u.setPhone(phone);
            String[] parts = request.getFullName().trim().split("\\s+", 2);
            u.setFirstName(parts[0]);
            u.setLastName(parts.length > 1 ? parts[1] : "");
            u.setPasswordHash(passwordEncoder.encode("1234"));
            u.setPasswordChangedAt(LocalDateTime.now());
            u.setCreatedBy("onboarding");
            u.setUpdatedBy("onboarding");
            roleService.grantRole(u, RoleName.TENANT, "onboarding");
            return userRepository.save(u);
        });

        Tenant tenant = tenantRepository.findByUserId(user.getId()).orElseGet(() -> {
            Tenant t = new Tenant();
            t.setUser(user);
            t.setNationalId(request.getIdNumber());
            try {
                t.setIdType(IdType.valueOf(request.getIdType()));
            } catch (Exception e) {
                t.setIdType(IdType.NATIONAL_ID);
            }
            t.setKycStatus(KycStatus.PENDING);
            t.setWalletId("wallet-" + System.currentTimeMillis());
            return tenantRepository.save(t);
        });

        OnboardingSession session = onboardingSessionRepository.findByInvitationCode(request.getInvitationCode())
                .orElseGet(OnboardingSession::new);
        session.setInvitationCode(request.getInvitationCode());
        session.setUserId(user.getId());
        session.setSessionType("TENANT");
        session.setCurrentStep(2);
        onboardingSessionRepository.save(session);

        eventPublisher.publish(OnboardingEvent.of(
                OnboardingEventType.TENANT_ONBOARDED,
                String.valueOf(tenant.getId()),
                Map.of("invitationCode", request.getInvitationCode(), "phase", "REGISTERED")));

        return TenantRegisterResponse.builder()
                .tenantId(String.valueOf(tenant.getId()))
                .walletId(tenant.getWalletId())
                .kycStatus(EntityMapper.toFrontendKycStatus(tenant.getKycStatus()))
                .securityDepositStkRef(null)
                .message("Registration complete. Continue with KYC and lease signing.")
                .build();
    }

    @Transactional
    public KycDocumentUploadResponse uploadDocuments(Long tenantId, MultipartFile idFront, MultipartFile idBack, MultipartFile selfie) throws IOException {
        tenantRepository.findById(tenantId)
                .orElseThrow(() -> new ResourceNotFoundException("Tenant not found"));
        List<String> uploaded = kycService.uploadTenantDocuments(tenantId, idFront, idBack, selfie);

        Tenant tenant = tenantRepository.findById(tenantId)
                .orElseThrow(() -> new ResourceNotFoundException("Tenant not found"));

        onboardingSessionRepository.findByUserId(tenant.getUser().getId())
                .ifPresent(session -> {
                    session.setCurrentStep(Math.max(session.getCurrentStep(), 3));
                    onboardingSessionRepository.save(session);
                });

        eventPublisher.publish(OnboardingEvent.of(
                OnboardingEventType.TENANT_ONBOARDED,
                String.valueOf(tenantId),
                Map.of("phase", "DOCUMENTS_UPLOADED")));

        return KycDocumentUploadResponse.builder()
                .kycStatus(EntityMapper.toFrontendKycStatus(tenant.getKycStatus()))
                .message("Documents uploaded successfully. Our team will review them shortly.")
                .documentsUploaded(uploaded)
                .build();
    }

    @Transactional(readOnly = true)
    public TenantOnboardingContextResponse getOnboardingContext(User user) {
        Tenant tenant = tenantRepository.findByUserId(user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Tenant profile not found"));

        String invitationCode = onboardingSessionRepository.findByUserId(user.getId())
                .map(OnboardingSession::getInvitationCode)
                .orElse(null);

        return TenantOnboardingContextResponse.builder()
                .tenantId(String.valueOf(tenant.getId()))
                .kycStatus(EntityMapper.toFrontendKycStatus(tenant.getKycStatus()))
                .invitationCode(invitationCode)
                .documentsComplete(kycService.hasCompleteTenantDocuments(tenant.getId()))
                .build();
    }

    @Transactional(readOnly = true)
    public LeaseSummaryResponse getLeaseSummary(Long tenantId, String invitationCode) {
        return tenancyCreationService.getLeaseSummary(tenantId, invitationCode);
    }

    @Transactional
    public TenancyCreationResponse signLease(Long tenantId, String invitationCode) {
        TenancyCreationResponse response = tenancyCreationService.signLeaseAndCreateTenancy(tenantId, invitationCode);
        eventPublisher.publish(OnboardingEvent.of(
                OnboardingEventType.TENANT_ONBOARDED,
                String.valueOf(tenantId),
                Map.of("invitationCode", invitationCode, "phase", "COMPLETED")));
        return response;
    }

    @Transactional
    public void setPaymentPlan(Long tenantId, PaymentPlanRequest request) {
        Tenant tenant = tenantRepository.findById(tenantId)
                .orElseThrow(() -> new ResourceNotFoundException("Tenant not found"));
        Tenancy tenancy = tenancyRepository.findByTenantId(tenantId)
                .orElseThrow(() -> new ResourceNotFoundException("Active tenancy required before payment plan"));
        tenancy.setPaymentPlan(PaymentPlan.valueOf(request.getPlan().toUpperCase()));
        tenancyRepository.save(tenancy);
    }

    @Transactional(readOnly = true)
    public TenantProfileResponse getProfile(Long tenantId) {
        return tenantRepository.findProfileSummary(tenantId)
                .map(row -> {
                    KycStatus kycStatus = KycStatus.PENDING;
                    if (row.getKycStatus() != null && !row.getKycStatus().isBlank()) {
                        try {
                            kycStatus = KycStatus.valueOf(row.getKycStatus().trim().toUpperCase(Locale.ROOT));
                        } catch (IllegalArgumentException ignored) {
                            kycStatus = KycStatus.PENDING;
                        }
                    }
                    return TenantProfileResponse.builder()
                            .tenantId(String.valueOf(row.getTenantId()))
                            .fullName(row.getFullName())
                            .phone(row.getPhone())
                            .unitName(row.getUnitNumber() != null ? row.getUnitNumber() : "")
                            .monthlyRent(row.getMonthlyRent() != null ? row.getMonthlyRent() : 0.0)
                            .kycStatus(EntityMapper.toFrontendKycStatus(kycStatus))
                            .build();
                })
                .orElseThrow(() -> new ResourceNotFoundException("Tenant not found"));
    }
}

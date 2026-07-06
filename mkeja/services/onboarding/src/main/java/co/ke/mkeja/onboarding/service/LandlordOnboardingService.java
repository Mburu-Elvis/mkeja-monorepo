package co.ke.mkeja.onboarding.service;

import co.ke.mkeja.onboarding.dto.request.LandlordOnboardingRequest;
import co.ke.mkeja.onboarding.dto.request.StakeholderRequest;
import co.ke.mkeja.onboarding.dto.response.KycDocumentUploadResponse;
import co.ke.mkeja.onboarding.dto.response.LandlordOnboardingResponse;
import co.ke.mkeja.onboarding.dto.response.OnboardingStatusResponse;
import co.ke.mkeja.onboarding.event.EventPublisher;
import co.ke.mkeja.onboarding.event.OnboardingEvent;
import co.ke.mkeja.onboarding.event.OnboardingEventType;
import co.ke.mkeja.onboarding.exception.BadRequestException;
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

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class LandlordOnboardingService {

    private final UserRepository userRepository;
    private final PropertyOwnerRepository propertyOwnerRepository;
    private final BankAccountRepository bankAccountRepository;
    private final CorporateStakeholderRepository corporateStakeholderRepository;
    private final OnboardingSessionRepository onboardingSessionRepository;
    private final PasswordEncoder passwordEncoder;
    private final KycService kycService;
    private final EventPublisher eventPublisher;
    private final RoleService roleService;

    @Transactional
    public LandlordOnboardingResponse submit(LandlordOnboardingRequest request) throws IOException {
        if (!request.isTerms()) {
            throw new BadRequestException("Terms must be accepted");
        }

        String phone = UserFieldNormalizer.normalizePhone(request.getPhone());
        if (userRepository.existsByPhone(phone)) {
            throw new BadRequestException("Phone number already registered");
        }

        OwnerSubtype subtype = mapUserType(request.getUserType());
        User user = createUser(request, phone, subtype);
        PropertyOwner owner = createPropertyOwner(request, user, subtype);
        createBankAccount(request, owner);
        createStakeholders(request, owner, subtype);

        if (request.getDocs() != null && !request.getDocs().isEmpty()) {
            kycService.uploadLandlordDocuments(owner.getId(), request.getDocs());
        }

        OnboardingSession session = new OnboardingSession();
        session.setUserId(user.getId());
        session.setSessionType("LANDLORD");
        session.setCurrentStep(4);
        session.setCompletedSteps("[1,2,3,4]");
        onboardingSessionRepository.save(session);

        eventPublisher.publish(OnboardingEvent.of(
                OnboardingEventType.LANDLORD_REGISTERED,
                String.valueOf(owner.getId()),
                Map.of("userId", user.getId(), "kycStatus", owner.getKycStatus().name())));

        return LandlordOnboardingResponse.builder()
                .applicationId(String.valueOf(owner.getId()))
                .kycStatus(EntityMapper.toFrontendKycStatus(owner.getKycStatus()))
                .message("KYC application submitted successfully")
                .build();
    }

    @Transactional
    public KycDocumentUploadResponse uploadDocuments(Long ownerId, Map<String, String> docs) throws IOException {
        PropertyOwner owner = propertyOwnerRepository.findById(ownerId)
                .orElseThrow(() -> new ResourceNotFoundException("Property owner not found"));
        List<String> uploaded = kycService.uploadLandlordDocuments(ownerId, docs);
        return KycDocumentUploadResponse.builder()
                .kycStatus(EntityMapper.toFrontendKycStatus(owner.getKycStatus()))
                .message("Documents uploaded successfully")
                .documentsUploaded(uploaded)
                .build();
    }

    @Transactional(readOnly = true)
    public OnboardingStatusResponse getStatus(Long ownerId) {
        PropertyOwner owner = propertyOwnerRepository.findById(ownerId)
                .orElseThrow(() -> new ResourceNotFoundException("Property owner not found"));
        int step = onboardingSessionRepository.findByUserId(owner.getUser().getId())
                .map(OnboardingSession::getCurrentStep)
                .orElse(4);
        return OnboardingStatusResponse.builder()
                .applicationId(String.valueOf(owner.getId()))
                .kycStatus(EntityMapper.toFrontendKycStatus(owner.getKycStatus()))
                .currentStep(step)
                .build();
    }

    private User createUser(LandlordOnboardingRequest request, String phone, OwnerSubtype subtype) {
        User user = new User();
        user.setPhone(phone);
        user.setEmail(UserFieldNormalizer.normalizeEmail(request.getEmail()));
        String[] parts = request.getFullName().trim().split("\\s+", 2);
        user.setFirstName(parts[0]);
        user.setLastName(parts.length > 1 ? parts[1] : "");
        String pin = request.getPin() != null ? request.getPin() : "1234";
        user.setPasswordHash(passwordEncoder.encode(pin));
        user.setPasswordChangedAt(LocalDateTime.now());
        user.setCreatedBy("onboarding");
        user.setUpdatedBy("onboarding");
        roleService.grantRole(user, RoleName.PROPERTY_OWNER, "onboarding");
        return userRepository.save(user);
    }

    private PropertyOwner createPropertyOwner(LandlordOnboardingRequest request, User user, OwnerSubtype subtype) {
        PropertyOwner owner = new PropertyOwner();
        owner.setUser(user);
        owner.setOwnerSubtype(subtype);
        owner.setOwnerType(subtype == OwnerSubtype.INDIVIDUAL ? OwnerType.INDIVIDUAL : OwnerType.COMPANY);
        owner.setNationalId(request.getIdNumber());
        owner.setKraPin(request.getKraPin());
        if (subtype == OwnerSubtype.CORPORATE) {
            owner.setCompanyName(request.getCompanyName());
            owner.setCompanyRegistrationNumber(request.getRegNumber());
        } else if (subtype == OwnerSubtype.SACCO) {
            owner.setCompanyName(request.getSaccoName());
            owner.setCompanyRegistrationNumber(request.getSaccoLic());
        }
        owner.setKycStatus(subtype == OwnerSubtype.INDIVIDUAL ? KycStatus.PENDING : KycStatus.MANUAL_REVIEW);
        return propertyOwnerRepository.save(owner);
    }

    private void createBankAccount(LandlordOnboardingRequest request, PropertyOwner owner) {
        if (request.getBankAccNum() == null || request.getBankAccNum().isBlank()) {
            return;
        }
        BankAccount account = new BankAccount();
        account.setPropertyOwner(owner);
        account.setBankCode(request.getBankCode());
        account.setBankName(request.getBankName());
        account.setAccountNumber(request.getBankAccNum());
        account.setBranch(request.getBankBranch());
        bankAccountRepository.save(account);
    }

    private void createStakeholders(LandlordOnboardingRequest request, PropertyOwner owner, OwnerSubtype subtype) {
        if (subtype == OwnerSubtype.CORPORATE) {
            saveStakeholders(owner, request.getDirectors(), StakeholderType.DIRECTOR);
            saveStakeholders(owner, request.getOwners(), StakeholderType.BENEFICIAL_OWNER);
        } else if (subtype == OwnerSubtype.SACCO) {
            saveStakeholders(owner, request.getTrustees(), StakeholderType.TRUSTEE);
        }
    }

    private void saveStakeholders(PropertyOwner owner, List<StakeholderRequest> stakeholders, StakeholderType type) {
        if (stakeholders == null) {
            return;
        }
        for (StakeholderRequest s : stakeholders) {
            if (s.getName() == null || s.getName().isBlank()) {
                continue;
            }
            CorporateStakeholder cs = new CorporateStakeholder();
            cs.setPropertyOwner(owner);
            cs.setStakeholderType(type);
            cs.setName(s.getName());
            cs.setNationalId(s.getId());
            cs.setKraPin(s.getKra());
            cs.setOwnershipPct(s.getPct());
            corporateStakeholderRepository.save(cs);
        }
    }

    private OwnerSubtype mapUserType(String userType) {
        if ("CORPORATE_LANDLORD".equals(userType)) {
            return OwnerSubtype.CORPORATE;
        }
        if ("SACCO".equals(userType)) {
            return OwnerSubtype.SACCO;
        }
        return OwnerSubtype.INDIVIDUAL;
    }
}

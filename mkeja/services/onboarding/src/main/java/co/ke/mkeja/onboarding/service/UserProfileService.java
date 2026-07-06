package co.ke.mkeja.onboarding.service;

import co.ke.mkeja.onboarding.dto.response.UserKycDocumentResponse;
import co.ke.mkeja.onboarding.dto.response.UserProfileResponse;
import co.ke.mkeja.onboarding.exception.BadRequestException;
import co.ke.mkeja.onboarding.exception.ResourceNotFoundException;
import co.ke.mkeja.onboarding.mapper.EntityMapper;
import co.ke.mkeja.onboarding.model.entity.Agent;
import co.ke.mkeja.onboarding.model.entity.KycDocument;
import co.ke.mkeja.onboarding.model.entity.Property;
import co.ke.mkeja.onboarding.model.entity.PropertyOwner;
import co.ke.mkeja.onboarding.model.entity.PropertyUnit;
import co.ke.mkeja.onboarding.model.entity.Tenant;
import co.ke.mkeja.onboarding.model.entity.User;
import co.ke.mkeja.onboarding.model.enums.DocumentType;
import co.ke.mkeja.onboarding.model.enums.KycDocumentOwnerType;
import co.ke.mkeja.onboarding.model.enums.KycStatus;
import co.ke.mkeja.onboarding.model.enums.TenancyStatus;
import co.ke.mkeja.onboarding.model.enums.UserType;
import co.ke.mkeja.onboarding.repository.AgentRepository;
import co.ke.mkeja.onboarding.repository.KycDocumentRepository;
import co.ke.mkeja.onboarding.repository.PropertyOwnerRepository;
import co.ke.mkeja.onboarding.repository.PropertyUnitRepository;
import co.ke.mkeja.onboarding.repository.TenancyRepository;
import co.ke.mkeja.onboarding.repository.TenantRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class UserProfileService {

    private final TenantRepository tenantRepository;
    private final PropertyOwnerRepository propertyOwnerRepository;
    private final AgentRepository agentRepository;
    private final KycDocumentRepository kycDocumentRepository;
    private final PropertyUnitRepository propertyUnitRepository;
    private final TenancyRepository tenancyRepository;
    private final AuthorizationService authorizationService;
    private final RoleService roleService;
    private final FileStorageService fileStorageService;

    @Transactional(readOnly = true)
    public UserProfileResponse buildProfile(User user) {
        KycStatus kycStatus = resolveKycStatus(user);
        LocalDateTime kycVerifiedAt = resolveKycVerifiedAt(user);

        UserProfileResponse.UserProfileResponseBuilder<?, ?> builder = UserProfileResponse.builder()
                .id(String.valueOf(user.getId()))
                .fullName(user.getFullName())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .phone(user.getPhone())
                .email(user.getEmail())
                .role(roleService.toFrontendRole(user))
                .status(user.isActive() ? "active" : "suspended")
                .kycStatus(EntityMapper.toFrontendKycStatus(kycStatus))
                .kycVerifiedAt(kycVerifiedAt)
                .joinedDate(user.getCreatedAt())
                .lastLoginAt(user.getLastLoginAt())
                .otpVerified(user.isOtpVerified())
                .lockReason(user.getLockReason());

        applyRoleProfile(user, builder);
        applyStats(user, builder);
        builder.kycDocuments(loadKycDocuments(user));

        return builder.build();
    }

    @Transactional(readOnly = true)
    public void assertUserOwnsDocument(User user, Long documentId) {
        KycDocument document = kycDocumentRepository.findById(documentId)
                .orElseThrow(() -> new ResourceNotFoundException("Document not found"));
        OwnerRef ownerRef = resolveOwnerRef(user)
                .orElseThrow(() -> new BadRequestException("No KYC profile found for this account"));
        if (!ownerRef.ownerType().equals(document.getOwnerType()) || !ownerRef.ownerId().equals(document.getOwnerId())) {
            throw new BadRequestException("You do not have access to this document");
        }
    }

    @Transactional(readOnly = true)
    public Resource loadDocument(Long documentId) throws IOException {
        KycDocument document = kycDocumentRepository.findById(documentId)
                .orElseThrow(() -> new ResourceNotFoundException("Document not found"));
        return fileStorageService.loadAsResource(document.getStorageKey());
    }

    @Transactional(readOnly = true)
    public String getDocumentContentType(Long documentId) throws IOException {
        KycDocument document = kycDocumentRepository.findById(documentId)
                .orElseThrow(() -> new ResourceNotFoundException("Document not found"));
        if (document.getMimeType() != null && !document.getMimeType().isBlank()) {
            return document.getMimeType();
        }
        return fileStorageService.probeContentType(document.getStorageKey());
    }

    private void applyRoleProfile(User user, UserProfileResponse.UserProfileResponseBuilder<?, ?> builder) {
        UserType userType = user.getUserType();
        if (userType == UserType.TENANT) {
            tenantRepository.findByUserId(user.getId()).ifPresent(tenant -> {
                builder.idType(tenant.getIdType() != null ? tenant.getIdType().name() : "NATIONAL_ID");
                builder.idNumber(tenant.getNationalId());
                builder.idVerified(tenant.isIdVerified());
                builder.gender(tenant.getGender() != null ? tenant.getGender().name() : null);
            });
            return;
        }
        if (userType == UserType.PROPERTY_OWNER) {
            propertyOwnerRepository.findByUserId(user.getId()).ifPresent(owner -> applyOwnerProfile(builder, owner));
            return;
        }
        if (userType == UserType.AGENT) {
            agentRepository.findByUserId(user.getId()).ifPresent(agent -> applyAgentProfile(builder, agent));
        }
    }

    private void applyOwnerProfile(UserProfileResponse.UserProfileResponseBuilder<?, ?> builder, PropertyOwner owner) {
        builder.idType("NATIONAL_ID");
        builder.idNumber(owner.getNationalId());
        builder.idVerified(owner.isIdVerified());
        builder.entityType(owner.getOwnerType() != null ? owner.getOwnerType().name() : null);
        builder.ownerSubtype(owner.getOwnerSubtype() != null ? owner.getOwnerSubtype().name() : null);
        builder.companyName(owner.getCompanyName());
        builder.companyRegistrationNumber(owner.getCompanyRegistrationNumber());
        builder.kraPin(owner.getKraPin());
    }

    private void applyAgentProfile(UserProfileResponse.UserProfileResponseBuilder<?, ?> builder, Agent agent) {
        builder.idType("NATIONAL_ID");
        builder.idNumber(agent.getNationalId());
        builder.agentType(agent.getAgentType() != null ? agent.getAgentType().name() : null);
        builder.entityType(agent.getAgentType() != null ? agent.getAgentType().name() : null);
        builder.companyName(agent.getCompanyName());
        builder.registrationNumber(agent.getRegistrationNumber());
        builder.kraPin(agent.getKraPin());
        builder.licenseNumber(agent.getLicenseNumber());
        builder.licenseExpiry(agent.getLicenseExpiry());
        builder.physicalAddress(agent.getPhysicalAddress());
        builder.city(agent.getCity());
        builder.county(agent.getCounty());
        builder.website(agent.getWebsite());
    }

    private void applyStats(User user, UserProfileResponse.UserProfileResponseBuilder<?, ?> builder) {
        if (roleService.isLandlord(user)) {
            List<Property> properties = authorizationService.listAccessibleProperties(user);
            int unitCount = 0;
            for (Property property : properties) {
                unitCount += propertyUnitRepository.findByPropertyId(property.getId()).size();
            }
            builder.propertyCount(properties.size());
            builder.unitCount(unitCount);
            if (roleService.isPropertyOwner(user)) {
                builder.tenantCount((int) tenancyRepository.countDistinctTenantsByLandlordUserId(
                        user.getId(), TenancyStatus.ACTIVE));
            }
        } else if (roleService.isTenant(user)) {
            int tenancyCount = (int) tenancyRepository.countByTenantUserId(user.getId());
            builder.tenancyCount(tenancyCount);
            builder.activeTenancyCount((int) tenancyRepository.findAdminSummariesByTenantUserId(user.getId()).stream()
                    .filter(row -> TenancyStatus.ACTIVE.name().equalsIgnoreCase(row.getStatus()))
                    .count());
        }
    }

    private List<UserKycDocumentResponse> loadKycDocuments(User user) {
        Optional<OwnerRef> ownerRef = resolveOwnerRef(user);
        if (ownerRef.isEmpty()) {
            return List.of();
        }
        List<UserKycDocumentResponse> documents = new ArrayList<>();
        for (KycDocument doc : kycDocumentRepository.findByOwnerTypeAndOwnerId(
                ownerRef.get().ownerType(), ownerRef.get().ownerId())) {
            documents.add(UserKycDocumentResponse.builder()
                    .documentId(String.valueOf(doc.getId()))
                    .docType(doc.getDocType().name())
                    .label(documentLabel(doc.getDocType()))
                    .status(doc.getStatus() != null ? EntityMapper.toFrontendKycStatus(doc.getStatus()) : "PENDING")
                    .fileName(doc.getFileName())
                    .mimeType(doc.getMimeType())
                    .uploadedAt(doc.getCreatedAt())
                    .build());
        }
        return documents;
    }

    private Optional<OwnerRef> resolveOwnerRef(User user) {
        UserType userType = user.getUserType();
        if (userType == null) {
            return Optional.empty();
        }
        return switch (userType) {
            case TENANT -> tenantRepository.findByUserId(user.getId())
                    .map(tenant -> new OwnerRef(KycDocumentOwnerType.TENANT, tenant.getId()));
            case PROPERTY_OWNER -> propertyOwnerRepository.findByUserId(user.getId())
                    .map(owner -> new OwnerRef(KycDocumentOwnerType.PROPERTY_OWNER, owner.getId()));
            case AGENT -> agentRepository.findByUserId(user.getId())
                    .map(agent -> new OwnerRef(KycDocumentOwnerType.AGENT, agent.getId()));
            default -> Optional.empty();
        };
    }

    private KycStatus resolveKycStatus(User user) {
        UserType userType = user.getUserType();
        if (userType == null) {
            return KycStatus.PENDING;
        }
        return switch (userType) {
            case TENANT -> tenantRepository.findByUserId(user.getId())
                    .map(Tenant::getKycStatus)
                    .orElse(KycStatus.PENDING);
            case PROPERTY_OWNER -> propertyOwnerRepository.findByUserId(user.getId())
                    .map(PropertyOwner::getKycStatus)
                    .orElse(KycStatus.PENDING);
            case AGENT -> agentRepository.findByUserId(user.getId())
                    .map(Agent::getKycStatus)
                    .orElse(KycStatus.PENDING);
            default -> KycStatus.APPROVED;
        };
    }

    private LocalDateTime resolveKycVerifiedAt(User user) {
        if (user.getUserType() == UserType.TENANT) {
            return tenantRepository.findByUserId(user.getId())
                    .map(Tenant::getKycVerifiedAt)
                    .orElse(null);
        }
        return null;
    }

    private String documentLabel(DocumentType docType) {
        return switch (docType) {
            case ID_FRONT -> "ID Front";
            case ID_BACK -> "ID Back";
            case SELFIE -> "Selfie / Liveness";
            case PROOF_OF_RESIDENCE -> "Proof of Residence";
            case PROOF_OF_BANK_OWNERSHIP -> "Proof of Bank Ownership";
            case INCORPORATION -> "Certificate of Incorporation";
            case CR12 -> "CR12 Form";
            case BIZ_ADDRESS -> "Proof of Business Address";
            case BOARD_RESOLUTION -> "Board Resolution";
            case SACCO_LICENSE -> "SACCO License";
            case SACCO_BYLAWS -> "SACCO Bylaws";
            case AGENT_LICENSE -> "Agency License";
        };
    }

    private record OwnerRef(KycDocumentOwnerType ownerType, Long ownerId) {}
}

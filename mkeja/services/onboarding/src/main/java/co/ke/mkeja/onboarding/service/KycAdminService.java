package co.ke.mkeja.onboarding.service;

import co.ke.mkeja.onboarding.dto.response.KycApplicationResponse;
import co.ke.mkeja.onboarding.event.EventPublisher;
import co.ke.mkeja.onboarding.event.OnboardingEvent;
import co.ke.mkeja.onboarding.event.OnboardingEventType;
import co.ke.mkeja.onboarding.exception.ResourceNotFoundException;
import co.ke.mkeja.onboarding.mapper.EntityMapper;
import co.ke.mkeja.onboarding.model.entity.Agent;
import co.ke.mkeja.onboarding.model.entity.KycDocument;
import co.ke.mkeja.onboarding.model.entity.PropertyOwner;
import co.ke.mkeja.onboarding.model.entity.Tenant;
import co.ke.mkeja.onboarding.model.entity.TenantInvitation;
import co.ke.mkeja.onboarding.model.enums.KycDocumentOwnerType;
import co.ke.mkeja.onboarding.model.enums.KycStatus;
import co.ke.mkeja.onboarding.repository.AgentRepository;
import co.ke.mkeja.onboarding.repository.KycDocumentRepository;
import co.ke.mkeja.onboarding.repository.OnboardingSessionRepository;
import co.ke.mkeja.onboarding.repository.PropertyOwnerRepository;
import co.ke.mkeja.onboarding.repository.TenantInvitationRepository;
import co.ke.mkeja.onboarding.repository.TenantRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class KycAdminService {

    private final TenantRepository tenantRepository;
    private final PropertyOwnerRepository propertyOwnerRepository;
    private final AgentRepository agentRepository;
    private final KycDocumentRepository kycDocumentRepository;
    private final OnboardingSessionRepository onboardingSessionRepository;
    private final TenantInvitationRepository invitationRepository;
    private final FileStorageService fileStorageService;
    private final EventPublisher eventPublisher;

    @Transactional(readOnly = true)
    public List<KycApplicationResponse> listApplications() {
        List<KycApplicationResponse> apps = new ArrayList<>();
        tenantRepository.findAll().stream()
                .filter(t -> isQueueStatus(t.getKycStatus()))
                .map(this::toTenantApplication)
                .forEach(apps::add);
        propertyOwnerRepository.findAll().stream()
                .filter(o -> isQueueStatus(o.getKycStatus()))
                .map(this::toLandlordApplication)
                .forEach(apps::add);
        agentRepository.findAll().stream()
                .filter(a -> isQueueStatus(a.getKycStatus()))
                .map(this::toAgentApplication)
                .forEach(apps::add);
        apps.sort((a, b) -> b.getSubmittedAt().compareTo(a.getSubmittedAt()));
        return apps;
    }

    @Transactional(readOnly = true)
    public KycApplicationResponse getApplication(String id, String type) {
        if ("TENANT".equalsIgnoreCase(type)) {
            Tenant tenant = tenantRepository.findById(Long.parseLong(id))
                    .orElseThrow(() -> new ResourceNotFoundException("Application not found"));
            return toTenantApplication(tenant);
        }
        if ("AGENT".equalsIgnoreCase(type)) {
            Agent agent = agentRepository.findById(Long.parseLong(id))
                    .orElseThrow(() -> new ResourceNotFoundException("Application not found"));
            return toAgentApplication(agent);
        }
        PropertyOwner owner = propertyOwnerRepository.findById(Long.parseLong(id))
                .orElseThrow(() -> new ResourceNotFoundException("Application not found"));
        return toLandlordApplication(owner);
    }

    @Transactional
    public void approve(String id, String type) {
        if ("TENANT".equalsIgnoreCase(type)) {
            Tenant tenant = tenantRepository.findById(Long.parseLong(id))
                    .orElseThrow(() -> new ResourceNotFoundException("Application not found"));
            tenant.setKycStatus(KycStatus.APPROVED);
            tenantRepository.save(tenant);
            publishKycEvent(OnboardingEventType.KYC_VERIFIED, tenant.getUser().getId(), "TENANT");
            return;
        }
        if ("AGENT".equalsIgnoreCase(type)) {
            Agent agent = agentRepository.findById(Long.parseLong(id))
                    .orElseThrow(() -> new ResourceNotFoundException("Application not found"));
            agent.setKycStatus(KycStatus.APPROVED);
            agentRepository.save(agent);
            publishKycEvent(OnboardingEventType.KYC_VERIFIED, agent.getUser().getId(), "AGENT");
            return;
        }
        PropertyOwner owner = propertyOwnerRepository.findById(Long.parseLong(id))
                .orElseThrow(() -> new ResourceNotFoundException("Application not found"));
        owner.setKycStatus(KycStatus.APPROVED);
        propertyOwnerRepository.save(owner);
        publishKycEvent(OnboardingEventType.KYC_VERIFIED, owner.getUser().getId(), "LANDLORD");
    }

    @Transactional
    public void reject(String id, String type, String reason) {
        if ("TENANT".equalsIgnoreCase(type)) {
            Tenant tenant = tenantRepository.findById(Long.parseLong(id))
                    .orElseThrow(() -> new ResourceNotFoundException("Application not found"));
            tenant.setKycStatus(KycStatus.REJECTED);
            tenantRepository.save(tenant);
            publishKycEvent(OnboardingEventType.KYC_REJECTED, tenant.getUser().getId(), "TENANT");
            return;
        }
        if ("AGENT".equalsIgnoreCase(type)) {
            Agent agent = agentRepository.findById(Long.parseLong(id))
                    .orElseThrow(() -> new ResourceNotFoundException("Application not found"));
            agent.setKycStatus(KycStatus.REJECTED);
            agentRepository.save(agent);
            publishKycEvent(OnboardingEventType.KYC_REJECTED, agent.getUser().getId(), "AGENT");
            return;
        }
        PropertyOwner owner = propertyOwnerRepository.findById(Long.parseLong(id))
                .orElseThrow(() -> new ResourceNotFoundException("Application not found"));
        owner.setKycStatus(KycStatus.REJECTED);
        propertyOwnerRepository.save(owner);
        publishKycEvent(OnboardingEventType.KYC_REJECTED, owner.getUser().getId(), "LANDLORD");
    }

    @Transactional
    public void flagForReview(String id, String type) {
        if ("TENANT".equalsIgnoreCase(type)) {
            Tenant tenant = tenantRepository.findById(Long.parseLong(id))
                    .orElseThrow(() -> new ResourceNotFoundException("Application not found"));
            tenant.setKycStatus(KycStatus.MANUAL_REVIEW);
            tenantRepository.save(tenant);
            return;
        }
        if ("AGENT".equalsIgnoreCase(type)) {
            Agent agent = agentRepository.findById(Long.parseLong(id))
                    .orElseThrow(() -> new ResourceNotFoundException("Application not found"));
            agent.setKycStatus(KycStatus.MANUAL_REVIEW);
            agentRepository.save(agent);
            return;
        }
        PropertyOwner owner = propertyOwnerRepository.findById(Long.parseLong(id))
                .orElseThrow(() -> new ResourceNotFoundException("Application not found"));
        owner.setKycStatus(KycStatus.MANUAL_REVIEW);
        propertyOwnerRepository.save(owner);
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

    private boolean isQueueStatus(KycStatus status) {
        return status == KycStatus.PENDING
                || status == KycStatus.MANUAL_REVIEW
                || status == KycStatus.REJECTED;
    }

    private KycApplicationResponse toTenantApplication(Tenant tenant) {
        KycApplicationResponse base = EntityMapper.toKycApplication(tenant);
        String landlordName = base.getLandlordName();
        String unitRef = base.getUnitRef();

        onboardingSessionRepository.findByUserId(tenant.getUser().getId()).ifPresent(session -> {
            if (session.getInvitationCode() != null) {
                invitationRepository.findByCode(session.getInvitationCode()).ifPresent(invitation -> {
                    base.setLandlordName(invitation.getLandlord().getFullName());
                    base.setUnitRef(invitation.getUnit().getUnitNumber());
                });
            }
        });

        return KycApplicationResponse.builder()
                .id(base.getId())
                .fullName(base.getFullName())
                .idNumber(base.getIdNumber())
                .idType(base.getIdType())
                .phone(tenant.getUser().getPhone())
                .email(tenant.getUser().getEmail())
                .landlordName(base.getLandlordName())
                .unitRef(base.getUnitRef())
                .submittedAt(base.getSubmittedAt())
                .status(base.getStatus())
                .applicantType("TENANT")
                .documents(loadDocuments(KycDocumentOwnerType.TENANT, tenant.getId()))
                .build();
    }

    private KycApplicationResponse toLandlordApplication(PropertyOwner owner) {
        KycApplicationResponse base = EntityMapper.toKycApplication(owner);
        return KycApplicationResponse.builder()
                .id(base.getId())
                .fullName(base.getFullName())
                .idNumber(base.getIdNumber())
                .idType(base.getIdType())
                .phone(owner.getUser().getPhone())
                .email(owner.getUser().getEmail())
                .kraPin(owner.getKraPin())
                .companyName(owner.getCompanyName())
                .landlordName(base.getLandlordName())
                .unitRef(base.getUnitRef())
                .submittedAt(base.getSubmittedAt())
                .status(base.getStatus())
                .applicantType("LANDLORD")
                .documents(loadDocuments(KycDocumentOwnerType.PROPERTY_OWNER, owner.getId()))
                .build();
    }

    private KycApplicationResponse toAgentApplication(Agent agent) {
        KycApplicationResponse base = EntityMapper.toKycApplication(agent);
        return KycApplicationResponse.builder()
                .id(base.getId())
                .fullName(base.getFullName())
                .idNumber(base.getIdNumber())
                .idType(base.getIdType())
                .phone(agent.getUser().getPhone())
                .email(agent.getUser().getEmail())
                .kraPin(agent.getKraPin())
                .companyName(agent.getCompanyName())
                .licenseNumber(agent.getLicenseNumber())
                .landlordName(base.getLandlordName())
                .unitRef(base.getUnitRef())
                .submittedAt(base.getSubmittedAt())
                .status(base.getStatus())
                .applicantType("AGENT")
                .documents(loadDocuments(KycDocumentOwnerType.AGENT, agent.getId()))
                .build();
    }

    private Map<String, String> loadDocuments(KycDocumentOwnerType ownerType, Long ownerId) {
        Map<String, String> documents = new LinkedHashMap<>();
        for (KycDocument doc : kycDocumentRepository.findByOwnerTypeAndOwnerId(ownerType, ownerId)) {
            documents.put(doc.getDocType().name(), String.valueOf(doc.getId()));
        }
        return documents;
    }

    private void publishKycEvent(OnboardingEventType type, Long userId, String applicantType) {
        eventPublisher.publish(OnboardingEvent.of(
                type,
                String.valueOf(userId),
                Map.of("userId", userId, "applicantType", applicantType)));
    }
}

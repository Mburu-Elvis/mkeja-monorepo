package co.ke.mkeja.onboarding.service;

import co.ke.mkeja.onboarding.exception.BadRequestException;
import co.ke.mkeja.onboarding.exception.ResourceNotFoundException;
import co.ke.mkeja.onboarding.model.entity.KycDocument;
import co.ke.mkeja.onboarding.model.entity.Agent;
import co.ke.mkeja.onboarding.model.entity.PropertyOwner;
import co.ke.mkeja.onboarding.model.entity.Tenant;
import co.ke.mkeja.onboarding.model.enums.DocumentType;
import co.ke.mkeja.onboarding.model.enums.KycDocumentOwnerType;
import co.ke.mkeja.onboarding.model.enums.KycStatus;
import co.ke.mkeja.onboarding.repository.AgentRepository;
import co.ke.mkeja.onboarding.repository.KycDocumentRepository;
import co.ke.mkeja.onboarding.repository.PropertyOwnerRepository;
import co.ke.mkeja.onboarding.repository.TenantRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.ArrayList;
import java.util.EnumSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class KycService {

    private final KycDocumentRepository kycDocumentRepository;
    private final PropertyOwnerRepository propertyOwnerRepository;
    private final AgentRepository agentRepository;
    private final TenantRepository tenantRepository;
    private final FileStorageService fileStorageService;

    @Transactional
    public List<String> uploadLandlordDocuments(Long ownerId, Map<String, String> docs) throws IOException {
        PropertyOwner owner = propertyOwnerRepository.findById(ownerId)
                .orElseThrow(() -> new ResourceNotFoundException("Property owner not found"));

        List<String> uploaded = new ArrayList<>();
        if (docs != null) {
            for (Map.Entry<String, String> entry : docs.entrySet()) {
                if (entry.getValue() == null || entry.getValue().isBlank()) {
                    continue;
                }
                DocumentType docType = mapDocType(entry.getKey());
                String storageKey = fileStorageService.storeBase64(entry.getValue(), "owner_" + ownerId + "_" + docType.name());
                saveDocument(KycDocumentOwnerType.PROPERTY_OWNER, ownerId, docType, storageKey, "application/octet-stream");
                uploaded.add(docType.name());
            }
        }

        if (owner.getOwnerSubtype() == co.ke.mkeja.onboarding.model.enums.OwnerSubtype.INDIVIDUAL) {
            owner.setKycStatus(KycStatus.PENDING);
        } else {
            owner.setKycStatus(KycStatus.MANUAL_REVIEW);
        }
        propertyOwnerRepository.save(owner);
        return uploaded;
    }

    @Transactional
    public List<String> uploadAgentDocuments(Long agentId, Map<String, String> docs) throws IOException {
        Agent agent = agentRepository.findById(agentId)
                .orElseThrow(() -> new ResourceNotFoundException("Agent not found"));

        List<String> uploaded = new ArrayList<>();
        if (docs != null) {
            for (Map.Entry<String, String> entry : docs.entrySet()) {
                if (entry.getValue() == null || entry.getValue().isBlank()) {
                    continue;
                }
                DocumentType docType = mapDocType(entry.getKey());
                String storageKey = fileStorageService.storeBase64(entry.getValue(), "agent_" + agentId + "_" + docType.name());
                saveDocument(KycDocumentOwnerType.AGENT, agentId, docType, storageKey, "application/octet-stream");
                uploaded.add(docType.name());
            }
        }

        if (agent.getAgentType() == co.ke.mkeja.onboarding.model.enums.AgentType.INDIVIDUAL) {
            agent.setKycStatus(KycStatus.PENDING);
        } else {
            agent.setKycStatus(KycStatus.MANUAL_REVIEW);
        }
        agentRepository.save(agent);
        return uploaded;
    }

    @Transactional
    public List<String> uploadTenantDocuments(Long tenantId, MultipartFile idFront, MultipartFile idBack, MultipartFile selfie) throws IOException {
        Tenant tenant = tenantRepository.findById(tenantId)
                .orElseThrow(() -> new ResourceNotFoundException("Tenant not found"));

        boolean hasComplete = hasCompleteTenantDocuments(tenantId);
        boolean hasFront = idFront != null && !idFront.isEmpty();
        boolean hasBack = idBack != null && !idBack.isEmpty();
        boolean hasSelfie = selfie != null && !selfie.isEmpty();
        boolean anyProvided = hasFront || hasBack || hasSelfie;

        if (!hasComplete) {
            requireFile(idFront, "ID front");
            requireFile(idBack, "ID back");
            requireFile(selfie, "Selfie");
        } else if (!anyProvided) {
            throw new BadRequestException("Select at least one document to add or update");
        }

        List<String> uploaded = new ArrayList<>();
        if (hasFront) {
            uploaded.add(saveMultipart(KycDocumentOwnerType.TENANT, tenantId, DocumentType.ID_FRONT, idFront));
        }
        if (hasBack) {
            uploaded.add(saveMultipart(KycDocumentOwnerType.TENANT, tenantId, DocumentType.ID_BACK, idBack));
        }
        if (hasSelfie) {
            uploaded.add(saveMultipart(KycDocumentOwnerType.TENANT, tenantId, DocumentType.SELFIE, selfie));
        }

        if (!uploaded.isEmpty()) {
            tenant.setKycStatus(KycStatus.MANUAL_REVIEW);
            tenantRepository.save(tenant);
        }
        return uploaded;
    }

    @Transactional(readOnly = true)
    public boolean hasCompleteTenantDocuments(Long tenantId) {
        Set<DocumentType> uploaded = kycDocumentRepository
                .findByOwnerTypeAndOwnerId(KycDocumentOwnerType.TENANT, tenantId)
                .stream()
                .map(KycDocument::getDocType)
                .collect(Collectors.toCollection(() -> EnumSet.noneOf(DocumentType.class)));
        return uploaded.containsAll(EnumSet.of(DocumentType.ID_FRONT, DocumentType.ID_BACK, DocumentType.SELFIE));
    }

    private void requireFile(MultipartFile file, String label) {
        if (file == null || file.isEmpty()) {
            throw new BadRequestException(label + " is required");
        }
    }

    private String saveMultipart(KycDocumentOwnerType ownerType, Long ownerId, DocumentType docType, MultipartFile file) throws IOException {
        String storageKey = fileStorageService.storeMultipart(file, ownerType.name().toLowerCase() + "_" + ownerId + "_" + docType.name());
        saveDocument(ownerType, ownerId, docType, storageKey, file.getContentType());
        return docType.name();
    }

    private void saveDocument(KycDocumentOwnerType ownerType, Long ownerId, DocumentType docType, String storageKey, String mimeType) {
        KycDocument doc = kycDocumentRepository
                .findByOwnerTypeAndOwnerIdAndDocType(ownerType, ownerId, docType)
                .orElseGet(KycDocument::new);
        doc.setOwnerType(ownerType);
        doc.setOwnerId(ownerId);
        doc.setDocType(docType);
        doc.setStorageKey(storageKey);
        doc.setMimeType(mimeType);
        doc.setStatus(KycStatus.PENDING);
        kycDocumentRepository.save(doc);
    }

    private DocumentType mapDocType(String key) {
        return switch (key) {
            case "idFront" -> DocumentType.ID_FRONT;
            case "idBack" -> DocumentType.ID_BACK;
            case "selfie" -> DocumentType.SELFIE;
            case "proofOfResidence" -> DocumentType.PROOF_OF_RESIDENCE;
            case "proofOfBankOwnership" -> DocumentType.PROOF_OF_BANK_OWNERSHIP;
            case "incorporation" -> DocumentType.INCORPORATION;
            case "cr12" -> DocumentType.CR12;
            case "bizAddress" -> DocumentType.BIZ_ADDRESS;
            case "boardRes" -> DocumentType.BOARD_RESOLUTION;
            case "saccoLic" -> DocumentType.SACCO_LICENSE;
            case "saccoBylaws" -> DocumentType.SACCO_BYLAWS;
            case "agentLicense" -> DocumentType.AGENT_LICENSE;
            default -> DocumentType.ID_FRONT;
        };
    }
}

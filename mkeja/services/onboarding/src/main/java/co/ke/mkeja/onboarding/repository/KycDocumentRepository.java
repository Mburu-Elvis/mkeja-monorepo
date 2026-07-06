package co.ke.mkeja.onboarding.repository;

import co.ke.mkeja.onboarding.model.entity.KycDocument;
import co.ke.mkeja.onboarding.model.enums.KycDocumentOwnerType;
import org.springframework.data.jpa.repository.JpaRepository;

import co.ke.mkeja.onboarding.model.enums.DocumentType;

import java.util.List;
import java.util.Optional;

public interface KycDocumentRepository extends JpaRepository<KycDocument, Long> {
    List<KycDocument> findByOwnerTypeAndOwnerId(KycDocumentOwnerType ownerType, Long ownerId);

    Optional<KycDocument> findByOwnerTypeAndOwnerIdAndDocType(
            KycDocumentOwnerType ownerType, Long ownerId, DocumentType docType);
}

package co.ke.mkeja.onboarding.model.entity;

import co.ke.mkeja.onboarding.model.enums.DocumentType;
import co.ke.mkeja.onboarding.model.enums.KycDocumentOwnerType;
import co.ke.mkeja.onboarding.model.enums.KycStatus;
import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
@EqualsAndHashCode(callSuper = true)
@Entity
@Table(name = "tbl_kyc_documents")
public class KycDocument extends BaseEntity {
    @Enumerated(EnumType.STRING)
    @Column(name = "owner_type", nullable = false)
    private KycDocumentOwnerType ownerType;

    @Column(name = "owner_id", nullable = false)
    private Long ownerId;

    @Enumerated(EnumType.STRING)
    @Column(name = "doc_type", nullable = false)
    private DocumentType docType;

    @Column(name = "storage_key", nullable = false)
    private String storageKey;

    @Column(name = "file_name")
    private String fileName;

    @Column(name = "mime_type")
    private String mimeType;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private KycStatus status = KycStatus.PENDING;
}

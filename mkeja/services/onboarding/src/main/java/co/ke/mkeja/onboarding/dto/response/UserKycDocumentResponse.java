package co.ke.mkeja.onboarding.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class UserKycDocumentResponse {
    private String documentId;
    private String docType;
    private String label;
    private String status;
    private String fileName;
    private String mimeType;
    private LocalDateTime uploadedAt;
}

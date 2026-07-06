package co.ke.mkeja.onboarding.dto.response;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class KycDocumentUploadResponse {
    private String kycStatus;
    private String message;
    private List<String> documentsUploaded;
}

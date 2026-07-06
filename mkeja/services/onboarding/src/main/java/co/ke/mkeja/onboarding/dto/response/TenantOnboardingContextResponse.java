package co.ke.mkeja.onboarding.dto.response;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class TenantOnboardingContextResponse {
    private String tenantId;
    private String kycStatus;
    private String invitationCode;
    private boolean documentsComplete;
}

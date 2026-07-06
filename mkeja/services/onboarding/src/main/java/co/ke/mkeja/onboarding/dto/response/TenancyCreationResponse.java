package co.ke.mkeja.onboarding.dto.response;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class TenancyCreationResponse {
    private String tenancyId;
    private String leaseId;
    private String invitationCode;
    private String message;
}

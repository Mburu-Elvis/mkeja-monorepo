package co.ke.mkeja.onboarding.dto.response;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class TenantRegisterResponse {
    private String tenantId;
    private String walletId;
    private String kycStatus;
    private String securityDepositStkRef;
    private String message;
}

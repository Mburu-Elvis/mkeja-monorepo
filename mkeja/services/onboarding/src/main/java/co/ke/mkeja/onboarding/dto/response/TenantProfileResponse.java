package co.ke.mkeja.onboarding.dto.response;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class TenantProfileResponse {
    private String tenantId;
    private String fullName;
    private String phone;
    private String unitName;
    private Double monthlyRent;
    private String kycStatus;
}

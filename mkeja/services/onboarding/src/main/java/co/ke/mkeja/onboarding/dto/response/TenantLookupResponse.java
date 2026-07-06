package co.ke.mkeja.onboarding.dto.response;

import co.ke.mkeja.onboarding.model.enums.KycStatus;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class TenantLookupResponse {
    private boolean registered;
    private String fullName;
    private String phone;
    private KycStatus kycStatus;
    private boolean canLinkImmediately;
    private String message;
}

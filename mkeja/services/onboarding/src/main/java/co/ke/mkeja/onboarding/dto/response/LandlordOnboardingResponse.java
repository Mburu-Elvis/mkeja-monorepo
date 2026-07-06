package co.ke.mkeja.onboarding.dto.response;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class LandlordOnboardingResponse {
    private String applicationId;
    private String kycStatus;
    private String message;
}

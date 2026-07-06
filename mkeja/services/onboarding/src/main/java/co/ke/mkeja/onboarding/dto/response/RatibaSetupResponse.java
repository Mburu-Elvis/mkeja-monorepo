package co.ke.mkeja.onboarding.dto.response;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class RatibaSetupResponse {
    private String scheduleId;
    private String status;
}

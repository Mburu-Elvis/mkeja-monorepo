package co.ke.mkeja.onboarding.dto.response;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class SecurityDepositResponse {
    private String stkRef;
    private String status;
}

package co.ke.mkeja.onboarding.dto.response;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ApiErrorResponse {
    private String message;
    private int status;
}

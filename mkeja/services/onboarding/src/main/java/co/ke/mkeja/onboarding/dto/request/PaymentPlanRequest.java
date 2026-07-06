package co.ke.mkeja.onboarding.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class PaymentPlanRequest {
    @NotBlank
    private String plan;
}

package co.ke.mkeja.onboarding.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class RatibaSetupRequest {
    @NotBlank
    private String plan;

    @NotNull
    private Double amount;
}

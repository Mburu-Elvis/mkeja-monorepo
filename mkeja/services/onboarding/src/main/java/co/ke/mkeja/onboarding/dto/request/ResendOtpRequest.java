package co.ke.mkeja.onboarding.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class ResendOtpRequest {
    @NotBlank
    private String challengeId;

    @NotBlank
    private String phone;
}

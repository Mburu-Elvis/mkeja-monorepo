package co.ke.mkeja.onboarding.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class VerifyOtpRequest {
    @NotBlank
    private String challengeId;

    @NotBlank
    private String phone;

    @NotBlank
    @Size(min = 6, max = 6)
    private String otp;
}

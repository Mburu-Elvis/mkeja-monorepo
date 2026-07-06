package co.ke.mkeja.onboarding.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

@Data
public class LoginRequest {
    @NotBlank
    private String phone;

    @NotBlank
    private String pin;
}

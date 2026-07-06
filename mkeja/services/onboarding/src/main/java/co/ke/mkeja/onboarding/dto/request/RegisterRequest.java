package co.ke.mkeja.onboarding.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class RegisterRequest {
    @NotBlank
    private String fullName;

    @NotBlank
    private String phone;

    private String email;

    private String idNumber;

    private String idType = "NATIONAL_ID";

    @NotBlank
    private String role;

    @NotBlank
    private String pin;

    @NotBlank
    private String confirmPin;
}

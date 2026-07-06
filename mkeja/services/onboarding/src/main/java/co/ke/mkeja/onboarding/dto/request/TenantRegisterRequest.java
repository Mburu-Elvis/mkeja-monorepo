package co.ke.mkeja.onboarding.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class TenantRegisterRequest {
    @NotBlank
    private String invitationCode;

    @NotBlank
    private String fullName;

    @NotBlank
    private String phone;

    @NotBlank
    private String idNumber;

    private String idType = "NATIONAL_ID";
}

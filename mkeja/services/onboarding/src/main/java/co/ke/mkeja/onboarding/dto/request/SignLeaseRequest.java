package co.ke.mkeja.onboarding.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class SignLeaseRequest {
    @NotBlank
    private String invitationCode;
}

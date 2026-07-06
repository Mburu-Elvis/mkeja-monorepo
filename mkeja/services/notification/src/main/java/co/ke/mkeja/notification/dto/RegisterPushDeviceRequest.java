package co.ke.mkeja.notification.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class RegisterPushDeviceRequest {
    @NotBlank
    private String token;

    @NotBlank
    private String platform;
}

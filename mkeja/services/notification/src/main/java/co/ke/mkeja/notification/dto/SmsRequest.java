package co.ke.mkeja.notification.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class SmsRequest {
    @NotNull
    private String from = "TIARA";

    @NotNull
    private String to;

    @NotNull
    private String message;

    @NotNull
    private String refId;
}

package co.ke.mkeja.notification.dto;

import co.ke.mkeja.notification.model.enums.Status;
import lombok.Data;

@Data
public class SmsError {
    private String timestamp;
    private Status status;
    private String error;
    private String message;
    private String path;
}

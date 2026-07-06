package co.ke.mkeja.notification.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class NotificationResponse {
    private Long id;
    private String title;
    private String message;
    private String type;
    private String category;
    private boolean read;
    private String link;
    private LocalDateTime createdAt;
}

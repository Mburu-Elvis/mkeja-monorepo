package co.ke.mkeja.notification.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.time.Instant;
import java.util.Map;

@Data
public class PlatformEventRequest {
    private String eventId;
    private String correlationId;
    private Instant timestamp;
    private String aggregateId;
    private int version;
    @NotBlank
    private String eventType;
    private Map<String, Object> payload;
    private String source;
}

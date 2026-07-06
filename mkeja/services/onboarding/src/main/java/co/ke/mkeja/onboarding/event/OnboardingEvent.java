package co.ke.mkeja.onboarding.event;

import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

@Data
@Builder
public class OnboardingEvent {
    private String eventId;
    private String correlationId;
    private Instant timestamp;
    private String aggregateId;
    private int version;
    private OnboardingEventType eventType;
    private Map<String, Object> payload;

    public static OnboardingEvent of(OnboardingEventType type, String aggregateId, Map<String, Object> payload) {
        return OnboardingEvent.builder()
                .eventId(UUID.randomUUID().toString())
                .correlationId(UUID.randomUUID().toString())
                .timestamp(Instant.now())
                .aggregateId(aggregateId)
                .version(1)
                .eventType(type)
                .payload(payload)
                .build();
    }
}

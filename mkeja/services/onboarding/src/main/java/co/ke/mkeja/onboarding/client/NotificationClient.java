package co.ke.mkeja.onboarding.client;

import co.ke.mkeja.onboarding.event.OnboardingEvent;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.util.HashMap;
import java.util.Map;

@Slf4j
@Component
public class NotificationClient {

    private final RestClient restClient;
    private final boolean enabled;
    private final String serviceKey;

    public NotificationClient(
            RestClient.Builder restClientBuilder,
            @Value("${notification.service.url:http://localhost:8083}") String baseUrl,
            @Value("${notification.service.enabled:true}") boolean enabled,
            @Value("${app.internal-service-key:mkeja-internal-dev-key}") String serviceKey) {
        this.restClient = restClientBuilder.baseUrl(baseUrl).build();
        this.enabled = enabled;
        this.serviceKey = serviceKey;
    }

    public void forwardEvent(OnboardingEvent event) {
        if (!enabled) {
            return;
        }

        Map<String, Object> body = new HashMap<>();
        body.put("eventId", event.getEventId());
        body.put("correlationId", event.getCorrelationId());
        body.put("timestamp", event.getTimestamp());
        body.put("aggregateId", event.getAggregateId());
        body.put("version", event.getVersion());
        body.put("eventType", event.getEventType().name());
        body.put("payload", event.getPayload());
        body.put("source", "onboarding");

        try {
            restClient.post()
                    .uri("/api/v1/notifications/events")
                    .header("X-Service-Key", serviceKey)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(body)
                    .retrieve()
                    .toBodilessEntity();
        } catch (Exception e) {
            log.warn("Failed to forward event {} to notification service: {}", event.getEventType(), e.getMessage());
        }
    }
}

package co.ke.mkeja.discovery.client;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

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

    public void publishListingInterestCreated(String aggregateId, Map<String, Object> payload) {
        if (!enabled) {
            log.debug("Notification forwarding disabled; skipping LISTING_INTEREST_CREATED for interest {}", aggregateId);
            return;
        }

        Map<String, Object> body = new HashMap<>();
        body.put("eventId", UUID.randomUUID().toString());
        body.put("correlationId", UUID.randomUUID().toString());
        body.put("timestamp", Instant.now());
        body.put("aggregateId", aggregateId);
        body.put("version", 1);
        body.put("eventType", "LISTING_INTEREST_CREATED");
        body.put("payload", payload);
        body.put("source", "discovery");

        try {
            restClient.post()
                    .uri("/api/v1/notifications/events")
                    .header("X-Service-Key", serviceKey)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(body)
                    .retrieve()
                    .toBodilessEntity();
            log.info(
                    "Forwarded LISTING_INTEREST_CREATED for interest {} (landlordUserId={})",
                    aggregateId,
                    payload.get("landlordUserId"));
        } catch (Exception e) {
            log.error(
                    "Failed to forward LISTING_INTEREST_CREATED for interest {} (landlordUserId={})",
                    aggregateId,
                    payload.get("landlordUserId"),
                    e);
        }
    }
}

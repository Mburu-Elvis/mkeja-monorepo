package co.ke.mkeja.onboarding.event;

import co.ke.mkeja.onboarding.client.NotificationClient;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class EventPublisher {

    private final NotificationClient notificationClient;

    public void publish(OnboardingEvent event) {
        log.info("ONBOARDING_EVENT type={} aggregateId={} eventId={} payload={}",
                event.getEventType(), event.getAggregateId(), event.getEventId(), event.getPayload());
        notificationClient.forwardEvent(event);
    }
}

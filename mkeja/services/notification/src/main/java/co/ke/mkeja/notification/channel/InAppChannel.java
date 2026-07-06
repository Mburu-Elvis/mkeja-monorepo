package co.ke.mkeja.notification.channel;

import co.ke.mkeja.notification.dto.PlatformEventRequest;
import co.ke.mkeja.notification.engine.NotificationDraft;
import co.ke.mkeja.notification.model.entity.Notification;
import co.ke.mkeja.notification.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.Optional;

@Slf4j
@Component
@RequiredArgsConstructor
public class InAppChannel {

    private final NotificationRepository notificationRepository;

    public Optional<Notification> deliver(NotificationDraft draft, PlatformEventRequest event) {
        if (draft.userId() == null) {
            return Optional.empty();
        }

        if (event.getEventId() != null
                && notificationRepository.existsByEventIdAndUserId(event.getEventId(), draft.userId())) {
            log.debug("Skipping duplicate in-app notification eventId={} userId={}", event.getEventId(), draft.userId());
            return notificationRepository.findByEventIdAndUserId(event.getEventId(), draft.userId());
        }

        Notification notification = new Notification();
        notification.setUserId(draft.userId());
        notification.setTitle(draft.title());
        notification.setMessage(draft.message());
        notification.setType(draft.type());
        notification.setCategory(draft.category());
        notification.setLink(draft.link());
        notification.setEventId(event.getEventId());
        notification.setEventType(event.getEventType());
        notification.setSource(event.getSource());
        return Optional.of(notificationRepository.save(notification));
    }
}

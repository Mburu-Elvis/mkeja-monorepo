package co.ke.mkeja.notification.channel;

import co.ke.mkeja.notification.dto.NotificationResponse;
import co.ke.mkeja.notification.dto.RealtimeMessage;
import co.ke.mkeja.notification.engine.NotificationDraft;
import co.ke.mkeja.notification.model.entity.Notification;
import co.ke.mkeja.notification.realtime.WebSocketSessionManager;
import co.ke.mkeja.notification.repository.NotificationRepository;
import co.ke.mkeja.notification.service.NotificationMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.Map;

@Slf4j
@Component
@RequiredArgsConstructor
public class WebChannel {

    private final WebSocketSessionManager sessionManager;
    private final NotificationRepository notificationRepository;

    public void deliver(NotificationDraft draft, Notification notification) {
        if (draft.userId() == null || notification == null) {
            return;
        }

        NotificationResponse response = NotificationMapper.toResponse(notification);
        sessionManager.sendToUser(draft.userId(), RealtimeMessage.builder()
                .type("NOTIFICATION")
                .payload(response)
                .build());

        long unreadCount = notificationRepository.countByUserIdAndReadFalse(draft.userId());
        sessionManager.sendToUser(draft.userId(), RealtimeMessage.builder()
                .type("UNREAD_COUNT")
                .payload(Map.of("count", unreadCount))
                .build());

        log.debug("Web channel delivered notificationId={} userId={}", notification.getId(), draft.userId());
    }
}

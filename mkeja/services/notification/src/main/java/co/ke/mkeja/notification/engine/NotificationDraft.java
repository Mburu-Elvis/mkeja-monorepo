package co.ke.mkeja.notification.engine;

import co.ke.mkeja.notification.model.enums.DeliveryChannel;
import co.ke.mkeja.notification.model.enums.NotificationCategory;
import co.ke.mkeja.notification.model.enums.NotificationType;
import lombok.Builder;

import java.util.Set;

@Builder
public record NotificationDraft(
        Long userId,
        String title,
        String message,
        NotificationType type,
        NotificationCategory category,
        String link,
        Set<DeliveryChannel> channels
) {}

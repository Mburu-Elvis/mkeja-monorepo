package co.ke.mkeja.notification.service;

import co.ke.mkeja.notification.dto.NotificationResponse;
import co.ke.mkeja.notification.model.entity.Notification;

public final class NotificationMapper {

    private NotificationMapper() {
    }

    public static NotificationResponse toResponse(Notification notification) {
        return NotificationResponse.builder()
                .id(notification.getId())
                .title(notification.getTitle())
                .message(notification.getMessage())
                .type(notification.getType().name().toLowerCase())
                .category(notification.getCategory().name())
                .read(notification.isRead())
                .link(notification.getLink())
                .createdAt(notification.getCreatedAt())
                .build();
    }
}

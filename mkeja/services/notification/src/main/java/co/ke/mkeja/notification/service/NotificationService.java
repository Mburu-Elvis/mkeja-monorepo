package co.ke.mkeja.notification.service;

import co.ke.mkeja.notification.dto.NotificationResponse;
import co.ke.mkeja.notification.dto.UnreadCountResponse;
import co.ke.mkeja.notification.exception.ResourceNotFoundException;
import co.ke.mkeja.notification.model.entity.Notification;
import co.ke.mkeja.notification.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;

    @Transactional(readOnly = true)
    public List<NotificationResponse> listForUser(Long userId) {
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(userId).stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public UnreadCountResponse unreadCount(Long userId) {
        return UnreadCountResponse.builder()
                .count(notificationRepository.countByUserIdAndReadFalse(userId))
                .build();
    }

    @Transactional
    public NotificationResponse markRead(Long userId, Long notificationId) {
        Notification notification = notificationRepository.findByIdAndUserId(notificationId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Notification not found"));
        notification.setRead(true);
        return toResponse(notificationRepository.save(notification));
    }

    @Transactional
    public void markAllRead(Long userId) {
        notificationRepository.findByUserIdOrderByCreatedAtDesc(userId).stream()
                .filter(n -> !n.isRead())
                .forEach(n -> {
                    n.setRead(true);
                    notificationRepository.save(n);
                });
    }

    @Transactional
    public void delete(Long userId, Long notificationId) {
        Notification notification = notificationRepository.findByIdAndUserId(notificationId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Notification not found"));
        notificationRepository.delete(notification);
    }

    @Transactional
    public void clearAll(Long userId) {
        notificationRepository.deleteByUserId(userId);
    }

    private NotificationResponse toResponse(Notification notification) {
        return NotificationMapper.toResponse(notification);
    }
}

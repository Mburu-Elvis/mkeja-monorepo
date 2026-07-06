package co.ke.mkeja.notification.repository;

import co.ke.mkeja.notification.model.entity.Notification;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.Optional;

public interface NotificationRepository extends JpaRepository<Notification, Long> {

    List<Notification> findByUserIdOrderByCreatedAtDesc(Long userId);

    long countByUserIdAndReadFalse(Long userId);

    Optional<Notification> findByIdAndUserId(Long id, Long userId);

    boolean existsByEventIdAndUserId(String eventId, Long userId);

    Optional<Notification> findByEventIdAndUserId(String eventId, Long userId);

    void deleteByUserId(Long userId);
}

package co.ke.mkeja.notification.channel;

import co.ke.mkeja.notification.engine.NotificationDraft;
import jakarta.persistence.EntityManager;
import jakarta.persistence.NoResultException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class SmsChannel {

    private final EntityManager entityManager;

    public void deliver(NotificationDraft draft) {
        if (draft.userId() == null) {
            return;
        }
        String phone = loadPhone(draft.userId());
        if (phone == null) {
            return;
        }
        log.info("SMS stub: to={} title={} message={}", phone, draft.title(), draft.message());
    }

    private String loadPhone(Long userId) {
        String sql = "SELECT u.phone FROM tbl_users u WHERE u.id = :userId";
        try {
            return String.valueOf(entityManager.createNativeQuery(sql)
                    .setParameter("userId", userId)
                    .getSingleResult());
        } catch (NoResultException e) {
            return null;
        }
    }
}

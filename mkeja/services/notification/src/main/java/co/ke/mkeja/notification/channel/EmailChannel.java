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
public class EmailChannel {

    private final EntityManager entityManager;

    public void deliver(NotificationDraft draft) {
        if (draft.userId() == null) {
            return;
        }
        String email = loadEmail(draft.userId());
        if (email == null || email.isBlank()) {
            return;
        }
        log.info("Email stub: to={} subject={} body={}", email, draft.title(), draft.message());
    }

    private String loadEmail(Long userId) {
        String sql = "SELECT u.email FROM tbl_users u WHERE u.id = :userId";
        try {
            Object result = entityManager.createNativeQuery(sql)
                    .setParameter("userId", userId)
                    .getSingleResult();
            return result != null ? String.valueOf(result) : null;
        } catch (NoResultException e) {
            return null;
        }
    }
}

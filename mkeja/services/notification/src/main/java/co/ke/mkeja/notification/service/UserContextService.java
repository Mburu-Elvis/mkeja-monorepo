package co.ke.mkeja.notification.service;

import co.ke.mkeja.notification.exception.ResourceNotFoundException;
import jakarta.persistence.EntityManager;
import jakarta.persistence.NoResultException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Service
@RequiredArgsConstructor
public class UserContextService {

    private final EntityManager entityManager;

    @Transactional(readOnly = true)
    public Long requireUserIdByPhone(String phone) {
        return loadUserIdByPhone(phone)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }

    @Transactional(readOnly = true)
    public Optional<Long> loadUserIdByPhone(String phone) {
        String sql = "SELECT u.id FROM tbl_users u WHERE u.phone = :phone LIMIT 1";
        try {
            Number id = (Number) entityManager.createNativeQuery(sql)
                    .setParameter("phone", phone)
                    .getSingleResult();
            return Optional.of(id.longValue());
        } catch (NoResultException e) {
            return Optional.empty();
        }
    }
}

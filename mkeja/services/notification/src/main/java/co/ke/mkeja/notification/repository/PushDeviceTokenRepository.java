package co.ke.mkeja.notification.repository;

import co.ke.mkeja.notification.model.entity.PushDeviceToken;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface PushDeviceTokenRepository extends JpaRepository<PushDeviceToken, Long> {

    List<PushDeviceToken> findByUserIdAndActiveTrue(Long userId);

    Optional<PushDeviceToken> findByToken(String token);

    void deleteByUserIdAndToken(Long userId, String token);
}

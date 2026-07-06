package co.ke.mkeja.onboarding.repository;

import co.ke.mkeja.onboarding.model.entity.StandingOrder;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface StandingOrderRepository extends JpaRepository<StandingOrder, Long> {
    Optional<StandingOrder> findByTenantId(Long tenantId);
}

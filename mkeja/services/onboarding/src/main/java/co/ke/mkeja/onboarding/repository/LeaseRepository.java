package co.ke.mkeja.onboarding.repository;

import co.ke.mkeja.onboarding.model.entity.Lease;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface LeaseRepository extends JpaRepository<Lease, Long> {
    Optional<Lease> findByTenantIdAndStatus(Long tenantId, co.ke.mkeja.onboarding.model.enums.LeaseStatus status);
}

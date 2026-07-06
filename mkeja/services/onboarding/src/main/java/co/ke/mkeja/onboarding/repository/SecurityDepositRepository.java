package co.ke.mkeja.onboarding.repository;

import co.ke.mkeja.onboarding.model.entity.SecurityDeposit;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface SecurityDepositRepository extends JpaRepository<SecurityDeposit, Long> {
    Optional<SecurityDeposit> findByTenantId(Long tenantId);
}

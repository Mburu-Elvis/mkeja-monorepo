package co.ke.mkeja.discovery.repository;

import co.ke.mkeja.discovery.model.entity.TenantPreference;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface TenantPreferenceRepository extends JpaRepository<TenantPreference, Long> {

    Optional<TenantPreference> findByTenantUserId(Long tenantUserId);
}

package co.ke.mkeja.discovery.repository;

import co.ke.mkeja.discovery.model.entity.SavedListing;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.Set;

public interface SavedListingRepository extends JpaRepository<SavedListing, Long> {

    List<SavedListing> findByTenantUserIdOrderByCreatedAtDesc(Long tenantUserId);

    Optional<SavedListing> findByTenantUserIdAndUnitId(Long tenantUserId, Long unitId);

    Set<SavedListing> findByTenantUserIdAndUnitIdIn(Long tenantUserId, List<Long> unitIds);

    void deleteByTenantUserIdAndUnitId(Long tenantUserId, Long unitId);
}

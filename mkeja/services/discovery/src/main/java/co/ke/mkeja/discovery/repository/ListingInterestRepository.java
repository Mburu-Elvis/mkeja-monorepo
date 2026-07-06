package co.ke.mkeja.discovery.repository;

import co.ke.mkeja.discovery.model.entity.ListingInterest;
import co.ke.mkeja.discovery.model.enums.InterestStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ListingInterestRepository extends JpaRepository<ListingInterest, Long> {

    List<ListingInterest> findByLandlordUserIdOrderByCreatedAtDesc(Long landlordUserId);

    Optional<ListingInterest> findByIdAndLandlordUserId(Long id, Long landlordUserId);

    boolean existsByTenantUserIdAndUnitIdAndStatusIn(Long tenantUserId, Long unitId, List<InterestStatus> statuses);

    boolean existsByTenantPhoneAndUnitIdAndStatusIn(String tenantPhone, Long unitId, List<InterestStatus> statuses);

    Optional<ListingInterest> findFirstByTenantUserIdAndUnitIdOrderByCreatedAtDesc(Long tenantUserId, Long unitId);
}

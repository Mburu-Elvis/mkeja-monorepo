package co.ke.mkeja.onboarding.repository;

import co.ke.mkeja.onboarding.model.entity.Tenant;
import co.ke.mkeja.onboarding.repository.projection.TenantProfileProjection;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface TenantRepository extends JpaRepository<Tenant, Long> {
    Optional<Tenant> findByUserId(Long userId);

    @Query(value = """
            SELECT tn.id AS tenantId,
                   TRIM(CONCAT(u.first_name, ' ', u.last_name)) AS fullName,
                   u.phone AS phone,
                   tn.kyc_status AS kycStatus,
                   pu.unit_number AS unitNumber,
                   pu.rent AS monthlyRent
            FROM tbl_tenants tn
            INNER JOIN tbl_users u ON tn.user_id = u.id
            LEFT JOIN tbl_tenancy t ON t.tenant_id = tn.id AND t.deleted_at IS NULL
            LEFT JOIN tbl_property_unit pu ON t.unit_id = pu.id
            WHERE tn.id = :tenantId
            ORDER BY t.created_at DESC NULLS LAST
            LIMIT 1
            """, nativeQuery = true)
    Optional<TenantProfileProjection> findProfileSummary(@Param("tenantId") Long tenantId);
}

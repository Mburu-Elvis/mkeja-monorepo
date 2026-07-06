package co.ke.mkeja.onboarding.repository;

import co.ke.mkeja.onboarding.model.entity.Tenancy;
import co.ke.mkeja.onboarding.model.enums.TenancyStatus;
import co.ke.mkeja.onboarding.repository.projection.AdminTenancyRow;
import co.ke.mkeja.onboarding.repository.projection.LandlordTenantSummaryProjection;
import co.ke.mkeja.onboarding.repository.projection.TenancyHistoryProjection;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface TenancyRepository extends JpaRepository<Tenancy, Long> {
    Optional<Tenancy> findByTenantId(Long tenantId);

    Optional<Tenancy> findByUnitIdAndStatus(Long unitId, TenancyStatus status);

    List<Tenancy> findAllByUnitId(Long unitId);

    long countByStatus(TenancyStatus status);

    @Query("SELECT COUNT(t) FROM Tenancy t WHERE t.tenant.user.id = :userId AND t.deletedAt IS NULL")
    long countByTenantUserId(@Param("userId") Long userId);

    @Query("""
            SELECT COALESCE(SUM(t.monthlyRent), 0) FROM Tenancy t
            WHERE t.status = :status AND t.deletedAt IS NULL AND t.monthlyRent IS NOT NULL
            """)
    double sumMonthlyRentByStatus(@Param("status") TenancyStatus status);

    @Query("""
            SELECT COALESCE(SUM(t.monthlyRent), 0) FROM Tenancy t
            WHERE t.status = :status AND t.deletedAt IS NULL
              AND t.createdAt >= :start AND t.createdAt < :end AND t.monthlyRent IS NOT NULL
            """)
    double sumMonthlyRentByStatusCreatedBetween(@Param("status") TenancyStatus status,
                                                @Param("start") LocalDateTime start,
                                                @Param("end") LocalDateTime end);

    @Query(value = """
            SELECT t.id AS id,
                   tn.id AS tenantId,
                   u.id AS tenantUserId,
                   TRIM(CONCAT(u.first_name, ' ', u.last_name)) AS tenantName,
                   u.phone AS tenantPhone,
                   pu.id AS unitId,
                   pu.unit_number AS unitNumber,
                   p.id AS propertyId,
                   p.name AS propertyName,
                   TRIM(CONCAT(lu.first_name, ' ', lu.last_name)) AS landlordName,
                   t.status AS status,
                   t.monthly_rent AS monthlyRent,
                   t.move_in_date AS moveInDate,
                   t.move_out_date AS moveOutDate,
                   t.lease_start_date AS leaseStartDate,
                   t.lease_end_date AS leaseEndDate,
                   l.id AS leaseId
            FROM tbl_tenancy t
            INNER JOIN tbl_tenants tn ON t.tenant_id = tn.id
            INNER JOIN tbl_users u ON tn.user_id = u.id
            INNER JOIN tbl_property_unit pu ON t.unit_id = pu.id
            INNER JOIN tbl_properties p ON pu.property_id = p.id
            INNER JOIN tbl_property_owner po ON p.owner_id = po.id
            INNER JOIN tbl_users lu ON po.user_id = lu.id
            LEFT JOIN tbl_leases l ON t.lease_id = l.id
            WHERE t.deleted_at IS NULL
            ORDER BY t.created_at DESC
            """, nativeQuery = true)
    List<AdminTenancyRow> findAllAdminSummaries();

    @Query(value = """
            SELECT t.id AS id,
                   tn.id AS tenantId,
                   u.id AS tenantUserId,
                   TRIM(CONCAT(u.first_name, ' ', u.last_name)) AS tenantName,
                   u.phone AS tenantPhone,
                   pu.id AS unitId,
                   pu.unit_number AS unitNumber,
                   p.id AS propertyId,
                   p.name AS propertyName,
                   TRIM(CONCAT(lu.first_name, ' ', lu.last_name)) AS landlordName,
                   t.status AS status,
                   t.monthly_rent AS monthlyRent,
                   t.move_in_date AS moveInDate,
                   t.move_out_date AS moveOutDate,
                   t.lease_start_date AS leaseStartDate,
                   t.lease_end_date AS leaseEndDate,
                   l.id AS leaseId
            FROM tbl_tenancy t
            INNER JOIN tbl_tenants tn ON t.tenant_id = tn.id
            INNER JOIN tbl_users u ON tn.user_id = u.id
            INNER JOIN tbl_property_unit pu ON t.unit_id = pu.id
            INNER JOIN tbl_properties p ON pu.property_id = p.id
            INNER JOIN tbl_property_owner po ON p.owner_id = po.id
            INNER JOIN tbl_users lu ON po.user_id = lu.id
            LEFT JOIN tbl_leases l ON t.lease_id = l.id
            WHERE t.deleted_at IS NULL AND u.id = :userId
            ORDER BY t.created_at DESC
            """, nativeQuery = true)
    List<AdminTenancyRow> findAdminSummariesByTenantUserId(@Param("userId") Long userId);

    @Query(value = """
            SELECT t.id AS id,
                   tn.id AS tenantId,
                   u.id AS tenantUserId,
                   TRIM(CONCAT(u.first_name, ' ', u.last_name)) AS tenantName,
                   u.phone AS tenantPhone,
                   pu.id AS unitId,
                   pu.unit_number AS unitNumber,
                   p.id AS propertyId,
                   p.name AS propertyName,
                   TRIM(CONCAT(lu.first_name, ' ', lu.last_name)) AS landlordName,
                   t.status AS status,
                   t.monthly_rent AS monthlyRent,
                   t.move_in_date AS moveInDate,
                   t.move_out_date AS moveOutDate,
                   t.lease_start_date AS leaseStartDate,
                   t.lease_end_date AS leaseEndDate,
                   l.id AS leaseId
            FROM tbl_tenancy t
            INNER JOIN tbl_tenants tn ON t.tenant_id = tn.id
            INNER JOIN tbl_users u ON tn.user_id = u.id
            INNER JOIN tbl_property_unit pu ON t.unit_id = pu.id
            INNER JOIN tbl_properties p ON pu.property_id = p.id
            INNER JOIN tbl_property_owner po ON p.owner_id = po.id
            INNER JOIN tbl_users lu ON po.user_id = lu.id
            LEFT JOIN tbl_leases l ON t.lease_id = l.id
            WHERE t.deleted_at IS NULL AND lu.id = :landlordUserId
            ORDER BY t.created_at DESC
            """, nativeQuery = true)
    List<AdminTenancyRow> findAdminSummariesByLandlordUserId(@Param("landlordUserId") Long landlordUserId);

    @Query(value = """
            SELECT t.id AS id,
                   tn.id AS tenantId,
                   u.id AS tenantUserId,
                   TRIM(CONCAT(u.first_name, ' ', u.last_name)) AS tenantName,
                   u.phone AS tenantPhone,
                   pu.id AS unitId,
                   pu.unit_number AS unitNumber,
                   p.id AS propertyId,
                   p.name AS propertyName,
                   TRIM(CONCAT(lu.first_name, ' ', lu.last_name)) AS landlordName,
                   t.status AS status,
                   t.monthly_rent AS monthlyRent,
                   t.move_in_date AS moveInDate,
                   t.move_out_date AS moveOutDate,
                   t.lease_start_date AS leaseStartDate,
                   t.lease_end_date AS leaseEndDate,
                   l.id AS leaseId
            FROM tbl_tenancy t
            INNER JOIN tbl_tenants tn ON t.tenant_id = tn.id
            INNER JOIN tbl_users u ON tn.user_id = u.id
            INNER JOIN tbl_property_unit pu ON t.unit_id = pu.id
            INNER JOIN tbl_properties p ON pu.property_id = p.id
            INNER JOIN tbl_property_owner po ON p.owner_id = po.id
            INNER JOIN tbl_users lu ON po.user_id = lu.id
            LEFT JOIN tbl_leases l ON t.lease_id = l.id
            WHERE t.deleted_at IS NULL AND p.id IN (:propertyIds)
            ORDER BY t.created_at DESC
            """, nativeQuery = true)
    List<AdminTenancyRow> findAdminSummariesByPropertyIds(@Param("propertyIds") Collection<Long> propertyIds);

    @Query(value = """
            SELECT t.id AS id,
                   tn.id AS tenantId,
                   u.id AS tenantUserId,
                   TRIM(CONCAT(u.first_name, ' ', u.last_name)) AS tenantName,
                   u.phone AS tenantPhone,
                   pu.id AS unitId,
                   pu.unit_number AS unitNumber,
                   p.id AS propertyId,
                   p.name AS propertyName,
                   TRIM(CONCAT(lu.first_name, ' ', lu.last_name)) AS landlordName,
                   t.status AS status,
                   t.monthly_rent AS monthlyRent,
                   t.move_in_date AS moveInDate,
                   t.move_out_date AS moveOutDate,
                   t.lease_start_date AS leaseStartDate,
                   t.lease_end_date AS leaseEndDate,
                   l.id AS leaseId
            FROM tbl_tenancy t
            INNER JOIN tbl_tenants tn ON t.tenant_id = tn.id
            INNER JOIN tbl_users u ON tn.user_id = u.id
            INNER JOIN tbl_property_unit pu ON t.unit_id = pu.id
            INNER JOIN tbl_properties p ON pu.property_id = p.id
            INNER JOIN tbl_property_owner po ON p.owner_id = po.id
            INNER JOIN tbl_users lu ON po.user_id = lu.id
            LEFT JOIN tbl_leases l ON t.lease_id = l.id
            WHERE t.deleted_at IS NULL AND t.id = :tenancyId
            """, nativeQuery = true)
    Optional<AdminTenancyRow> findAdminSummaryById(@Param("tenancyId") Long tenancyId);

    @Query("""
            SELECT t FROM Tenancy t
            WHERE t.tenant.user.id = :userId
            ORDER BY t.createdAt DESC
            """)
    List<Tenancy> findAllByTenantUserId(@Param("userId") Long userId);

    @Query("""
            SELECT t FROM Tenancy t
            WHERE t.unit.property.owner.user.id = :landlordUserId
            ORDER BY t.createdAt DESC
            """)
    List<Tenancy> findAllByLandlordUserId(@Param("landlordUserId") Long landlordUserId);

    @Query("""
            SELECT COUNT(DISTINCT t.tenant.id) FROM Tenancy t
            WHERE t.unit.property.owner.user.id = :landlordUserId
              AND t.status = :status
            """)
    long countDistinctTenantsByLandlordUserId(@Param("landlordUserId") Long landlordUserId,
                                              @Param("status") TenancyStatus status);

    @Query("""
            SELECT t FROM Tenancy t
            WHERE t.unit.id = :unitId
            ORDER BY t.createdAt DESC
            """)
    List<Tenancy> findAllByUnitIdOrderByCreatedAtDesc(@Param("unitId") Long unitId);

    @Query("""
            SELECT t FROM Tenancy t
            WHERE t.unit.property.id IN :propertyIds
            ORDER BY t.createdAt DESC
            """)
    List<Tenancy> findAllByPropertyIdIn(@Param("propertyIds") Collection<Long> propertyIds);

    @Query(value = """
            SELECT t.id AS tenancyId,
                   tn.id AS tenantId,
                   TRIM(CONCAT(u.first_name, ' ', u.last_name)) AS tenantName,
                   u.phone AS tenantPhone,
                   tn.kyc_status AS kycStatus,
                   t.status AS tenancyStatus,
                   p.id AS propertyId,
                   p.name AS propertyName,
                   pu.unit_number AS unitNumber,
                   pu.id AS unitId,
                   pu.floor_number AS floorNumber,
                   pu.wing AS wing,
                   t.monthly_rent AS monthlyRent,
                   t.rent_due_day AS rentDueDay,
                   t.lease_start_date AS leaseStartDate,
                   t.lease_end_date AS leaseEndDate,
                   CASE WHEN t.invitation_id IS NOT NULL THEN 'invitation' ELSE 'direct' END AS source
            FROM tbl_tenancy t
            INNER JOIN tbl_tenants tn ON t.tenant_id = tn.id
            INNER JOIN tbl_users u ON tn.user_id = u.id
            INNER JOIN tbl_property_unit pu ON t.unit_id = pu.id
            INNER JOIN tbl_properties p ON pu.property_id = p.id
            WHERE p.id IN (:propertyIds)
              AND t.deleted_at IS NULL
            ORDER BY t.created_at DESC
            """, nativeQuery = true)
    List<LandlordTenantSummaryProjection> findLandlordSummariesByPropertyIds(
            @Param("propertyIds") Collection<Long> propertyIds);

    @Query(value = """
            SELECT t.id AS tenancyId,
                   tn.id AS tenantId,
                   TRIM(CONCAT(u.first_name, ' ', u.last_name)) AS tenantName,
                   u.phone AS tenantPhone,
                   tn.kyc_status AS kycStatus,
                   t.status AS tenancyStatus,
                   p.id AS propertyId,
                   p.name AS propertyName,
                   pu.unit_number AS unitNumber,
                   pu.id AS unitId,
                   pu.floor_number AS floorNumber,
                   pu.wing AS wing,
                   t.monthly_rent AS monthlyRent,
                   t.rent_due_day AS rentDueDay,
                   t.lease_start_date AS leaseStartDate,
                   t.lease_end_date AS leaseEndDate,
                   CASE WHEN t.invitation_id IS NOT NULL THEN 'invitation' ELSE 'direct' END AS source
            FROM tbl_tenancy t
            INNER JOIN tbl_tenants tn ON t.tenant_id = tn.id
            INNER JOIN tbl_users u ON tn.user_id = u.id
            INNER JOIN tbl_property_unit pu ON t.unit_id = pu.id
            INNER JOIN tbl_properties p ON pu.property_id = p.id
            WHERE p.id IN (:propertyIds)
              AND tn.id = :tenantId
              AND t.deleted_at IS NULL
            ORDER BY t.created_at DESC
            LIMIT 1
            """, nativeQuery = true)
    Optional<LandlordTenantSummaryProjection> findLandlordSummaryByTenantIdAndPropertyIds(
            @Param("tenantId") Long tenantId,
            @Param("propertyIds") Collection<Long> propertyIds);

    @Query(value = """
            SELECT t.id AS tenancyId,
                   tn.id AS tenantId,
                   TRIM(CONCAT(u.first_name, ' ', u.last_name)) AS tenantName,
                   u.phone AS tenantPhone,
                   t.status AS status,
                   t.lease_start_date AS leaseStartDate,
                   t.lease_end_date AS leaseEndDate,
                   t.move_in_date AS moveInDate,
                   t.move_out_date AS moveOutDate,
                   t.monthly_rent AS monthlyRent,
                   t.rent_due_day AS rentDueDay
            FROM tbl_tenancy t
            LEFT JOIN tbl_tenants tn ON t.tenant_id = tn.id
            LEFT JOIN tbl_users u ON tn.user_id = u.id
            WHERE t.unit_id = :unitId
              AND t.deleted_at IS NULL
            ORDER BY t.created_at DESC
            """, nativeQuery = true)
    List<TenancyHistoryProjection> findUnitHistoryByUnitId(@Param("unitId") Long unitId);

    @Query("""
            SELECT t FROM Tenancy t
            JOIN FETCH t.unit u
            JOIN FETCH u.property p
            LEFT JOIN FETCH p.owner o
            LEFT JOIN FETCH o.user
            LEFT JOIN FETCH p.agent a
            LEFT JOIN FETCH a.user
            WHERE t.id = :tenancyId AND t.tenant.user.id = :userId AND t.deletedAt IS NULL
            """)
    Optional<Tenancy> findDetailedByIdAndTenantUserId(@Param("tenancyId") Long tenancyId, @Param("userId") Long userId);

    @Query("""
            SELECT t FROM Tenancy t
            JOIN FETCH t.unit u
            JOIN FETCH u.property p
            LEFT JOIN FETCH p.owner o
            LEFT JOIN FETCH o.user
            LEFT JOIN FETCH p.agent a
            LEFT JOIN FETCH a.user
            JOIN FETCH t.tenant tn
            LEFT JOIN FETCH tn.user
            WHERE t.id = :tenancyId AND p.owner.user.id = :landlordUserId AND t.deletedAt IS NULL
            """)
    Optional<Tenancy> findDetailedByIdAndLandlordUserId(
            @Param("tenancyId") Long tenancyId,
            @Param("landlordUserId") Long landlordUserId);

    @Query("""
            SELECT t FROM Tenancy t
            JOIN FETCH t.unit u
            JOIN FETCH u.property p
            LEFT JOIN FETCH p.owner o
            LEFT JOIN FETCH o.user
            LEFT JOIN FETCH p.agent a
            LEFT JOIN FETCH a.user
            JOIN FETCH t.tenant tn
            LEFT JOIN FETCH tn.user
            WHERE t.id = :tenancyId AND p.agent.user.id = :agentUserId AND t.deletedAt IS NULL
            """)
    Optional<Tenancy> findDetailedByIdAndAgentUserId(
            @Param("tenancyId") Long tenancyId,
            @Param("agentUserId") Long agentUserId);

    @Query("""
            SELECT t FROM Tenancy t
            JOIN FETCH t.unit u
            JOIN FETCH u.property p
            JOIN FETCH t.tenant tn
            LEFT JOIN FETCH tn.user
            WHERE p.agent.user.id = :agentUserId AND t.deletedAt IS NULL
            ORDER BY t.updatedAt DESC
            """)
    List<Tenancy> findAllDetailedByAgentUserId(@Param("agentUserId") Long agentUserId);
}

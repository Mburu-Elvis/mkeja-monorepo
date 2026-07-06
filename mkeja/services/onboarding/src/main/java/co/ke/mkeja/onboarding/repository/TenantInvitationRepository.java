package co.ke.mkeja.onboarding.repository;

import co.ke.mkeja.onboarding.model.entity.TenantInvitation;
import co.ke.mkeja.onboarding.model.enums.InvitationStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import co.ke.mkeja.onboarding.repository.projection.AdminInvitationRow;
import co.ke.mkeja.onboarding.repository.projection.TenantInvitationRow;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface TenantInvitationRepository extends JpaRepository<TenantInvitation, Long> {
    Optional<TenantInvitation> findByCode(String code);
    List<TenantInvitation> findByLandlordIdAndStatus(Long landlordId, InvitationStatus status);

    @Query("""
            SELECT i FROM TenantInvitation i
            WHERE i.landlord.id = :landlordId
              AND i.status IN ('PENDING', 'VIEWED')
            ORDER BY i.createdAt DESC
            """)
    List<TenantInvitation> findActiveByLandlordId(@Param("landlordId") Long landlordId);

    @Query("""
            SELECT COUNT(i) FROM TenantInvitation i
            WHERE i.unit.property.id = :propertyId
              AND i.status IN ('PENDING', 'VIEWED')
            """)
    long countPendingByPropertyId(@Param("propertyId") Long propertyId);

    Optional<TenantInvitation> findFirstByUnitIdAndStatusIn(Long unitId, List<InvitationStatus> statuses);

    List<TenantInvitation> findAllByUnitId(Long unitId);

    @Query("""
            SELECT i FROM TenantInvitation i
            WHERE i.unit.property.id IN :propertyIds
              AND i.status IN ('PENDING', 'VIEWED')
            ORDER BY i.createdAt DESC
            """)
    List<TenantInvitation> findActiveByPropertyIds(@Param("propertyIds") Collection<Long> propertyIds);

    @Query(value = """
            SELECT i.code AS code,
                   i.status AS status,
                   TRIM(CONCAT(lu.first_name, ' ', lu.last_name)) AS landlordName,
                   p.name AS propertyName,
                   u.unit_number AS unitNumber,
                   u.id AS unitId,
                   p.id AS propertyId,
                   i.monthly_rent AS monthlyRent,
                   i.lease_start_date AS leaseStartDate,
                   i.expires_at AS expiresAt
            FROM tbl_tenant_invitations i
            INNER JOIN tbl_property_unit u ON i.unit_id = u.id
            INNER JOIN tbl_properties p ON u.property_id = p.id
            INNER JOIN tbl_users lu ON i.landlord_id = lu.id
            WHERE i.tenant_phone = :phone
              AND i.status IN ('PENDING', 'VIEWED')
              AND i.expires_at > NOW()
              AND i.deleted_at IS NULL
            ORDER BY i.created_at DESC
            """, nativeQuery = true)
    List<TenantInvitationRow> findActiveByTenantPhone(@Param("phone") String phone);

    @Query(value = """
            SELECT i.id AS id,
                   i.code AS code,
                   i.status AS status,
                   i.tenant_name AS tenantName,
                   i.tenant_phone AS tenantPhone,
                   TRIM(CONCAT(lu.first_name, ' ', lu.last_name)) AS landlordName,
                   lu.id AS landlordUserId,
                   p.name AS propertyName,
                   p.id AS propertyId,
                   u.unit_number AS unitNumber,
                   u.id AS unitId,
                   i.monthly_rent AS monthlyRent,
                   i.lease_start_date AS leaseStartDate,
                   i.expires_at AS expiresAt,
                   i.created_at AS createdAt
            FROM tbl_tenant_invitations i
            INNER JOIN tbl_property_unit u ON i.unit_id = u.id
            INNER JOIN tbl_properties p ON u.property_id = p.id
            INNER JOIN tbl_users lu ON i.landlord_id = lu.id
            WHERE i.deleted_at IS NULL
            ORDER BY i.created_at DESC
            """, nativeQuery = true)
    List<AdminInvitationRow> findAllAdminSummaries();

    @Query("""
            SELECT COUNT(i) FROM TenantInvitation i
            WHERE i.deletedAt IS NULL
              AND i.status IN (co.ke.mkeja.onboarding.model.enums.InvitationStatus.PENDING,
                               co.ke.mkeja.onboarding.model.enums.InvitationStatus.VIEWED)
            """)
    long countPendingInvitations();
}

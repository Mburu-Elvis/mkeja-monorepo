package co.ke.mkeja.discovery.service;

import co.ke.mkeja.discovery.exception.BadRequestException;
import co.ke.mkeja.discovery.exception.ResourceNotFoundException;
import jakarta.persistence.EntityManager;
import jakarta.persistence.NoResultException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Service
@RequiredArgsConstructor
public class TenantContextService {

    private final EntityManager entityManager;

    public record TenantContext(
            Long userId,
            Long tenantId,
            String fullName,
            String phone,
            String kycStatus,
            Double currentRent,
            String currentCity,
            String currentCounty
    ) {}

    @Transactional(readOnly = true)
    public TenantContext requireApprovedTenant(String phone) {
        TenantContext context = loadTenantContext(phone)
                .orElseThrow(() -> new ResourceNotFoundException("Tenant profile not found"));

        if (!isApprovedKyc(context.kycStatus())) {
            throw new BadRequestException("Complete and pass KYC before using house hunt features");
        }
        return context;
    }

    @Transactional(readOnly = true)
    public Optional<TenantContext> loadTenantContext(String phone) {
        String sql = """
                SELECT u.id,
                       t.id,
                       CONCAT(u.first_name, ' ', u.last_name),
                       u.phone,
                       t.kyc_status,
                       ten.monthly_rent,
                       p.city,
                       p.county
                FROM tbl_users u
                JOIN tbl_tenants t ON t.user_id = u.id
                LEFT JOIN tbl_tenancy ten ON ten.tenant_id = t.id AND ten.status = 'ACTIVE'
                LEFT JOIN tbl_property_unit pu ON ten.unit_id = pu.id
                LEFT JOIN tbl_properties p ON pu.property_id = p.id
                WHERE u.phone = :phone
                ORDER BY ten.created_at DESC NULLS LAST
                LIMIT 1
                """;

        try {
            Object[] row = (Object[]) entityManager.createNativeQuery(sql)
                    .setParameter("phone", phone)
                    .getSingleResult();

            return Optional.of(new TenantContext(
                    ((Number) row[0]).longValue(),
                    ((Number) row[1]).longValue(),
                    row[2] != null ? String.valueOf(row[2]).trim() : "",
                    String.valueOf(row[3]),
                    row[4] != null ? String.valueOf(row[4]) : "PENDING",
                    row[5] != null ? ((Number) row[5]).doubleValue() : null,
                    row[6] != null ? String.valueOf(row[6]) : null,
                    row[7] != null ? String.valueOf(row[7]) : null
            ));
        } catch (NoResultException e) {
            return Optional.empty();
        }
    }

    @Transactional(readOnly = true)
    public Long requireLandlordUserId(String phone) {
        String sql = """
                SELECT u.id
                FROM tbl_users u
                JOIN tbl_property_owner po ON po.user_id = u.id
                WHERE u.phone = :phone
                LIMIT 1
                """;
        try {
            Number id = (Number) entityManager.createNativeQuery(sql)
                    .setParameter("phone", phone)
                    .getSingleResult();
            return id.longValue();
        } catch (NoResultException e) {
            throw new ResourceNotFoundException("Landlord profile not found");
        }
    }

    @Transactional(readOnly = true)
    public Optional<Long> loadUserIdByPhone(String phone) {
        String sql = """
                SELECT u.id
                FROM tbl_users u
                WHERE u.phone = :phone
                LIMIT 1
                """;
        try {
            Number id = (Number) entityManager.createNativeQuery(sql)
                    .setParameter("phone", phone)
                    .getSingleResult();
            return Optional.of(id.longValue());
        } catch (NoResultException e) {
            return Optional.empty();
        }
    }

    public boolean isApprovedKyc(String status) {
        return "APPROVED".equalsIgnoreCase(status) || "VERIFIED".equalsIgnoreCase(status);
    }
}

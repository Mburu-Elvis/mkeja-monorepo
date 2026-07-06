package co.ke.mkeja.onboarding.service;

import co.ke.mkeja.onboarding.dto.request.AdminReassignTenancyRequest;
import co.ke.mkeja.onboarding.dto.response.AdminTenancyDetailResponse;
import co.ke.mkeja.onboarding.event.EventPublisher;
import co.ke.mkeja.onboarding.event.OnboardingEvent;
import co.ke.mkeja.onboarding.event.OnboardingEventType;
import co.ke.mkeja.onboarding.exception.BadRequestException;
import co.ke.mkeja.onboarding.exception.ResourceNotFoundException;
import co.ke.mkeja.onboarding.model.entity.Lease;
import co.ke.mkeja.onboarding.model.entity.PropertyUnit;
import co.ke.mkeja.onboarding.model.entity.Tenancy;
import co.ke.mkeja.onboarding.model.entity.Tenant;
import co.ke.mkeja.onboarding.model.entity.User;
import co.ke.mkeja.onboarding.model.enums.LeaseStatus;
import co.ke.mkeja.onboarding.model.enums.TenancyStatus;
import co.ke.mkeja.onboarding.model.enums.UnitStatus;
import co.ke.mkeja.onboarding.repository.PropertyUnitRepository;
import co.ke.mkeja.onboarding.repository.TenancyRepository;
import co.ke.mkeja.onboarding.repository.TenantRepository;
import co.ke.mkeja.onboarding.repository.projection.AdminTenancyRow;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class AdminTenancyService {

    private final TenancyRepository tenancyRepository;
    private final PropertyUnitRepository propertyUnitRepository;
    private final TenantRepository tenantRepository;
    private final HouseHuntService houseHuntService;
    private final EventPublisher eventPublisher;

    @Transactional(readOnly = true)
    public List<AdminTenancyDetailResponse> listTenancies(String status, String search) {
        return tenancyRepository.findAllAdminSummaries().stream()
                .filter(row -> matchesStatus(row, status))
                .filter(row -> matchesSearch(row, search))
                .sorted(Comparator.comparing(AdminTenancyRow::getId, Comparator.nullsLast(Comparator.reverseOrder())))
                .map(this::toDetail)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public AdminTenancyDetailResponse getTenancy(Long tenancyId) {
        AdminTenancyRow row = tenancyRepository.findAdminSummaryById(tenancyId)
                .orElseThrow(() -> new ResourceNotFoundException("Tenancy not found"));
        return toDetail(row);
    }

    @Transactional
    public AdminTenancyDetailResponse terminateTenancy(Long tenancyId, User admin) {
        Tenancy tenancy = requireTenancy(tenancyId);
        if (tenancy.getStatus() == TenancyStatus.TERMINATED) {
            throw new BadRequestException("Tenancy is already terminated");
        }

        PropertyUnit unit = tenancy.getUnit();
        Tenant tenant = tenancy.getTenant();
        LocalDate today = LocalDate.now();

        tenancy.setStatus(TenancyStatus.TERMINATED);
        tenancy.setMoveOutDate(today);
        if (tenancy.getLeaseEndDate() == null || tenancy.getLeaseEndDate().isAfter(today)) {
            tenancy.setLeaseEndDate(today);
        }

        Lease lease = tenancy.getLease();
        if (lease != null) {
            lease.setStatus(LeaseStatus.TERMINATED);
            lease.setEndDate(today);
        }

        if (unit != null) {
            unit.setStatus(UnitStatus.VACANT);
            unit.setTenant(null);
            propertyUnitRepository.save(unit);
            houseHuntService.syncUnitListing(unit.getProperty(), unit);
        }

        if (tenant != null) {
            if (tenant.getUnit() != null && unit != null && tenant.getUnit().getId().equals(unit.getId())) {
                tenant.setUnit(null);
            }
            if (tenant.getProperty() != null && unit != null
                    && tenant.getProperty().getId().equals(unit.getProperty().getId())) {
                tenant.setProperty(null);
            }
            tenantRepository.save(tenant);
        }

        tenancyRepository.save(tenancy);
        publishTenancyEvent(OnboardingEventType.TENANCY_TERMINATED, tenancy, admin);
        log.info("Admin {} terminated tenancy {}", admin.getId(), tenancyId);
        return getTenancy(tenancyId);
    }

    @Transactional
    public AdminTenancyDetailResponse reassignTenancy(Long tenancyId, AdminReassignTenancyRequest request, User admin) {
        if (request.getUnitId() == null) {
            throw new BadRequestException("Target unitId is required");
        }

        Tenancy tenancy = requireTenancy(tenancyId);
        if (tenancy.getStatus() != TenancyStatus.ACTIVE && tenancy.getStatus() != TenancyStatus.PENDING) {
            throw new BadRequestException("Only active or pending tenancies can be reassigned");
        }

        PropertyUnit newUnit = propertyUnitRepository.findById(request.getUnitId())
                .orElseThrow(() -> new ResourceNotFoundException("Target unit not found"));
        if (newUnit.getDeletedAt() != null) {
            throw new BadRequestException("Target unit is not available");
        }
        if (newUnit.getStatus() != UnitStatus.VACANT) {
            throw new BadRequestException("Target unit is not vacant");
        }

        PropertyUnit oldUnit = tenancy.getUnit();
        if (oldUnit != null && oldUnit.getId().equals(newUnit.getId())) {
            throw new BadRequestException("Tenant is already on this unit");
        }

        Tenant tenant = tenancy.getTenant();
        tenancy.setUnit(newUnit);
        tenancy.setStatus(TenancyStatus.ACTIVE);

        Lease lease = tenancy.getLease();
        if (lease != null) {
            lease.setUnit(newUnit);
            if (lease.getStatus() != LeaseStatus.ACTIVE) {
                lease.setStatus(LeaseStatus.ACTIVE);
            }
        }

        if (tenant != null) {
            tenant.setUnit(newUnit);
            tenant.setProperty(newUnit.getProperty());
            tenantRepository.save(tenant);
        }

        newUnit.setStatus(UnitStatus.OCCUPIED);
        newUnit.setTenant(tenant);
        propertyUnitRepository.save(newUnit);
        houseHuntService.syncUnitListing(newUnit.getProperty(), newUnit);

        if (oldUnit != null) {
            oldUnit.setStatus(UnitStatus.VACANT);
            oldUnit.setTenant(null);
            propertyUnitRepository.save(oldUnit);
            houseHuntService.syncUnitListing(oldUnit.getProperty(), oldUnit);
        }

        tenancyRepository.save(tenancy);
        log.info("Admin {} reassigned tenancy {} to unit {}", admin.getId(), tenancyId, newUnit.getId());
        return getTenancy(tenancyId);
    }

    private Tenancy requireTenancy(Long tenancyId) {
        Tenancy tenancy = tenancyRepository.findById(tenancyId)
                .orElseThrow(() -> new ResourceNotFoundException("Tenancy not found"));
        if (tenancy.getDeletedAt() != null) {
            throw new ResourceNotFoundException("Tenancy not found");
        }
        return tenancy;
    }

    private AdminTenancyDetailResponse toDetail(AdminTenancyRow row) {
        return AdminTenancyDetailResponse.builder()
                .id(row.getId())
                .tenantId(row.getTenantId())
                .tenantUserId(row.getTenantUserId() != null ? String.valueOf(row.getTenantUserId()) : null)
                .tenantName(row.getTenantName())
                .tenantPhone(row.getTenantPhone())
                .unitId(row.getUnitId())
                .unitNumber(row.getUnitNumber())
                .propertyId(row.getPropertyId())
                .propertyName(row.getPropertyName())
                .landlordName(row.getLandlordName())
                .status(row.getStatus())
                .monthlyRent(row.getMonthlyRent())
                .moveInDate(row.getMoveInDate())
                .moveOutDate(row.getMoveOutDate())
                .leaseStartDate(row.getLeaseStartDate())
                .leaseEndDate(row.getLeaseEndDate())
                .leaseId(row.getLeaseId())
                .build();
    }

    private boolean matchesStatus(AdminTenancyRow row, String status) {
        if (status == null || status.isBlank() || "all".equalsIgnoreCase(status)) {
            return true;
        }
        return row.getStatus() != null && row.getStatus().equalsIgnoreCase(status.trim());
    }

    private boolean matchesSearch(AdminTenancyRow row, String search) {
        if (search == null || search.isBlank()) {
            return true;
        }
        String term = search.toLowerCase(Locale.ROOT);
        return (row.getTenantName() != null && row.getTenantName().toLowerCase(Locale.ROOT).contains(term))
                || (row.getTenantPhone() != null && row.getTenantPhone().contains(term))
                || (row.getPropertyName() != null && row.getPropertyName().toLowerCase(Locale.ROOT).contains(term))
                || (row.getUnitNumber() != null && row.getUnitNumber().toLowerCase(Locale.ROOT).contains(term))
                || String.valueOf(row.getId()).contains(term);
    }

    private void publishTenancyEvent(OnboardingEventType type, Tenancy tenancy, User admin) {
        eventPublisher.publish(OnboardingEvent.of(
                type,
                String.valueOf(tenancy.getId()),
                Map.of(
                        "tenantId", tenancy.getTenant() != null ? tenancy.getTenant().getId() : null,
                        "unitId", tenancy.getUnit() != null ? tenancy.getUnit().getId() : null,
                        "adminId", admin.getId())));
    }
}

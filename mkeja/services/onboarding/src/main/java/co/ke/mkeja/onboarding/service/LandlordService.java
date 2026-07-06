package co.ke.mkeja.onboarding.service;

import co.ke.mkeja.onboarding.dto.response.*;
import co.ke.mkeja.onboarding.exception.ResourceNotFoundException;
import co.ke.mkeja.onboarding.model.entity.Property;
import co.ke.mkeja.onboarding.model.entity.PropertyUnit;
import co.ke.mkeja.onboarding.model.entity.TenantInvitation;
import co.ke.mkeja.onboarding.model.entity.User;
import co.ke.mkeja.onboarding.repository.TenantInvitationRepository;
import co.ke.mkeja.onboarding.repository.TenancyRepository;
import co.ke.mkeja.onboarding.repository.TenantRepository;
import co.ke.mkeja.onboarding.repository.projection.LandlordTenantSummaryProjection;
import co.ke.mkeja.onboarding.repository.projection.TenancyHistoryProjection;
import co.ke.mkeja.onboarding.model.enums.KycStatus;
import co.ke.mkeja.onboarding.model.enums.TenancyStatus;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Locale;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class LandlordService {

    private final TenancyRepository tenancyRepository;
    private final TenantInvitationRepository invitationRepository;
    private final TenantRepository tenantRepository;
    private final AuthorizationService authorizationService;

    @Transactional(readOnly = true)
    public List<LandlordTenantSummaryResponse> listTenants(User landlord, Long propertyId, Integer floor, String search) {
        Set<Long> accessiblePropertyIds = accessiblePropertyIds(landlord);
        if (accessiblePropertyIds.isEmpty()) {
            return List.of();
        }
        return tenancyRepository.findLandlordSummariesByPropertyIds(accessiblePropertyIds).stream()
                .filter(row -> matchesProperty(row, propertyId))
                .filter(row -> matchesFloor(row, floor))
                .filter(row -> matchesSearch(row, search))
                .map(this::toTenantSummary)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<LandlordInvitationSummaryResponse> listPendingInvitations(User landlord, Long propertyId, Integer floor, String search) {
        Set<Long> accessiblePropertyIds = accessiblePropertyIds(landlord);
        if (accessiblePropertyIds.isEmpty()) {
            return List.of();
        }
        return invitationRepository.findActiveByPropertyIds(accessiblePropertyIds).stream()
                .filter(i -> matchesProperty(i, propertyId))
                .filter(i -> matchesFloor(i, floor))
                .filter(i -> matchesSearch(i, search))
                .map(this::toInvitationSummary)
                .toList();
    }

    @Transactional(readOnly = true)
    public UnitHistoryResponse getUnitHistory(User landlord, Long unitId) {
        PropertyUnit unit = authorizationService.requireUnitAccess(landlord, unitId);

        List<TenancyHistoryItemResponse> tenancies = tenancyRepository.findUnitHistoryByUnitId(unitId).stream()
                .map(this::toTenancyHistoryItem)
                .toList();

        var property = unit.getProperty();
        return UnitHistoryResponse.builder()
                .unitId(unit.getId())
                .propertyId(property.getId())
                .propertyName(property.getName())
                .unitNumber(unit.getUnitNumber())
                .floorNumber(unit.getFloorNumber())
                .wing(unit.getWing())
                .rent(unit.getRent())
                .status(unit.getStatus())
                .tenancies(tenancies)
                .build();
    }

    @Transactional(readOnly = true)
    public LandlordTenantSummaryResponse getTenantDetail(User landlord, Long tenantId) {
        if (!tenantRepository.existsById(tenantId)) {
            throw new ResourceNotFoundException("Tenant not found");
        }

        Set<Long> accessiblePropertyIds = accessiblePropertyIds(landlord);
        return tenancyRepository.findLandlordSummaryByTenantIdAndPropertyIds(tenantId, accessiblePropertyIds)
                .map(this::toTenantSummary)
                .orElseThrow(() -> new ResourceNotFoundException("No tenancy found for this tenant"));
    }

    private Set<Long> accessiblePropertyIds(User user) {
        return authorizationService.listAccessibleProperties(user).stream()
                .map(Property::getId)
                .collect(Collectors.toSet());
    }

    private LandlordTenantSummaryResponse toTenantSummary(LandlordTenantSummaryProjection row) {
        return LandlordTenantSummaryResponse.builder()
                .tenancyId(row.getTenancyId())
                .tenantId(row.getTenantId())
                .tenantName(row.getTenantName())
                .tenantPhone(row.getTenantPhone())
                .kycStatus(KycStatus.valueOf(row.getKycStatus()))
                .tenancyStatus(TenancyStatus.valueOf(row.getTenancyStatus()))
                .propertyId(row.getPropertyId())
                .propertyName(row.getPropertyName() != null ? row.getPropertyName() : "")
                .unitNumber(row.getUnitNumber())
                .unitId(row.getUnitId())
                .floorNumber(row.getFloorNumber())
                .wing(row.getWing())
                .monthlyRent(row.getMonthlyRent())
                .rentDueDay(row.getRentDueDay())
                .leaseStartDate(row.getLeaseStartDate())
                .leaseEndDate(row.getLeaseEndDate())
                .source(row.getSource())
                .build();
    }

    private LandlordInvitationSummaryResponse toInvitationSummary(TenantInvitation invitation) {
        var unit = invitation.getUnit();
        var property = unit.getProperty();
        return LandlordInvitationSummaryResponse.builder()
                .code(invitation.getCode())
                .status(invitation.getStatus())
                .tenantName(invitation.getTenantName())
                .tenantPhone(invitation.getTenantPhone())
                .propertyId(property != null ? property.getId() : null)
                .propertyName(property != null ? property.getName() : "")
                .unitNumber(unit.getUnitNumber())
                .unitId(unit.getId())
                .floorNumber(unit.getFloorNumber())
                .wing(unit.getWing())
                .monthlyRent(invitation.getMonthlyRent())
                .rentDueDay(invitation.getRentDueDay())
                .leaseStartDate(invitation.getLeaseStartDate())
                .expiresAt(invitation.getExpiresAt())
                .existingTenant(invitation.getLinkedTenant() != null)
                .build();
    }

    private TenancyHistoryItemResponse toTenancyHistoryItem(TenancyHistoryProjection row) {
        return TenancyHistoryItemResponse.builder()
                .tenancyId(row.getTenancyId())
                .tenantId(row.getTenantId())
                .tenantName(row.getTenantName())
                .tenantPhone(row.getTenantPhone())
                .status(TenancyStatus.valueOf(row.getStatus()))
                .leaseStartDate(row.getLeaseStartDate())
                .leaseEndDate(row.getLeaseEndDate())
                .moveInDate(row.getMoveInDate())
                .moveOutDate(row.getMoveOutDate())
                .monthlyRent(row.getMonthlyRent())
                .rentDueDay(row.getRentDueDay())
                .build();
    }

    private boolean matchesProperty(LandlordTenantSummaryProjection row, Long propertyId) {
        if (propertyId == null) return true;
        return row.getPropertyId().equals(propertyId);
    }

    private boolean matchesProperty(TenantInvitation invitation, Long propertyId) {
        if (propertyId == null) return true;
        return invitation.getUnit().getProperty().getId().equals(propertyId);
    }

    private boolean matchesFloor(LandlordTenantSummaryProjection row, Integer floor) {
        if (floor == null) return true;
        return Objects.equals(row.getFloorNumber(), floor);
    }

    private boolean matchesFloor(TenantInvitation invitation, Integer floor) {
        if (floor == null) return true;
        return Objects.equals(invitation.getUnit().getFloorNumber(), floor);
    }

    private boolean matchesSearch(LandlordTenantSummaryProjection row, String search) {
        if (search == null || search.isBlank()) return true;
        String term = search.toLowerCase(Locale.ROOT);
        return row.getTenantName().toLowerCase(Locale.ROOT).contains(term)
                || row.getTenantPhone().contains(term)
                || row.getUnitNumber().toLowerCase(Locale.ROOT).contains(term)
                || (row.getPropertyName() != null && row.getPropertyName().toLowerCase(Locale.ROOT).contains(term));
    }

    private boolean matchesSearch(TenantInvitation invitation, String search) {
        if (search == null || search.isBlank()) return true;
        String term = search.toLowerCase(Locale.ROOT);
        var unit = invitation.getUnit();
        var property = unit.getProperty();
        return invitation.getTenantName().toLowerCase(Locale.ROOT).contains(term)
                || invitation.getTenantPhone().contains(term)
                || unit.getUnitNumber().toLowerCase(Locale.ROOT).contains(term)
                || (property.getName() != null && property.getName().toLowerCase(Locale.ROOT).contains(term));
    }
}
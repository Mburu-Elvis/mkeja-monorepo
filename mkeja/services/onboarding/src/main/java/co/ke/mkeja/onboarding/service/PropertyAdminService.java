package co.ke.mkeja.onboarding.service;

import co.ke.mkeja.onboarding.exception.ResourceNotFoundException;
import co.ke.mkeja.onboarding.model.entity.Property;
import co.ke.mkeja.onboarding.model.entity.PropertyImage;
import co.ke.mkeja.onboarding.model.entity.PropertyUnit;
import co.ke.mkeja.onboarding.model.entity.Tenancy;
import co.ke.mkeja.onboarding.model.entity.Tenant;
import co.ke.mkeja.onboarding.model.entity.TenantInvitation;
import co.ke.mkeja.onboarding.model.enums.TenancyStatus;
import co.ke.mkeja.onboarding.model.enums.UnitStatus;
import co.ke.mkeja.onboarding.repository.LeaseRepository;
import co.ke.mkeja.onboarding.repository.PropertyImageRepository;
import co.ke.mkeja.onboarding.repository.PropertyRepository;
import co.ke.mkeja.onboarding.repository.PropertyUnitRepository;
import co.ke.mkeja.onboarding.repository.TenancyRepository;
import co.ke.mkeja.onboarding.repository.TenantInvitationRepository;
import co.ke.mkeja.onboarding.repository.TenantRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Slf4j
@Service
@RequiredArgsConstructor
public class PropertyAdminService {

    private final PropertyRepository propertyRepository;
    private final PropertyUnitRepository propertyUnitRepository;
    private final PropertyImageRepository propertyImageRepository;
    private final TenantInvitationRepository invitationRepository;
    private final TenancyRepository tenancyRepository;
    private final TenantRepository tenantRepository;
    private final LeaseRepository leaseRepository;
    private final FileStorageService fileStorageService;
    private final HouseHuntService houseHuntService;

    @Transactional
    public void deletePropertyCompletely(Long propertyId) {
        Property property = propertyRepository.findById(propertyId)
                .orElseThrow(() -> new ResourceNotFoundException("Property not found"));

        LocalDateTime now = LocalDateTime.now();
        List<PropertyUnit> units = propertyUnitRepository.findByPropertyId(propertyId);
        Set<Long> leaseIds = new HashSet<>();

        for (PropertyUnit unit : units) {
            List<TenantInvitation> invitations = invitationRepository.findAllByUnitId(unit.getId());
            for (TenantInvitation invitation : invitations) {
                invitation.setDeletedAt(now);
            }
            invitationRepository.saveAll(invitations);

            List<Tenancy> tenancies = tenancyRepository.findAllByUnitId(unit.getId());
            for (Tenancy tenancy : tenancies) {
                if (tenancy.getLease() != null) {
                    leaseIds.add(tenancy.getLease().getId());
                }
                tenancy.setDeletedAt(now);
                tenancy.setStatus(TenancyStatus.TERMINATED);
            }
            tenancyRepository.saveAll(tenancies);

            Tenant occupant = unit.getTenant();
            if (occupant != null) {
                if (occupant.getUnit() != null && occupant.getUnit().getId().equals(unit.getId())) {
                    occupant.setUnit(null);
                }
                if (occupant.getProperty() != null && occupant.getProperty().getId().equals(propertyId)) {
                    occupant.setProperty(null);
                }
                tenantRepository.save(occupant);
            }

            unit.setStatus(UnitStatus.VACANT);
            unit.setTenant(null);
            unit.setDeletedAt(now);
        }
        propertyUnitRepository.saveAll(units);

        for (Long leaseId : leaseIds) {
            leaseRepository.findById(leaseId).ifPresent(lease -> lease.setDeletedAt(now));
        }

        List<PropertyImage> images = propertyImageRepository.findByPropertyIdAndDeletedAtIsNullOrderBySortOrderAsc(propertyId);
        for (PropertyImage image : images) {
            deleteStoredFile(image.getStorageKey());
            image.setDeletedAt(now);
        }

        property.setDeletedAt(now);
        property.setActive(false);
        property.setHouseHuntEnabled(false);
        property.setAutoRecommendEnabled(false);

        propertyRepository.save(property);
        houseHuntService.syncPropertyListings(property);
        log.info("Property {} and related records soft-deleted", propertyId);
    }

    private void deleteStoredFile(String storageKey) {
        if (storageKey == null || storageKey.isBlank()) {
            return;
        }
        try {
            fileStorageService.delete(storageKey);
        } catch (Exception ex) {
            log.warn("Could not delete file {}: {}", storageKey, ex.getMessage());
        }
    }
}

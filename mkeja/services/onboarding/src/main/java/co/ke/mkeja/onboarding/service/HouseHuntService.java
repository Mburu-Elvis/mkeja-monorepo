package co.ke.mkeja.onboarding.service;

import co.ke.mkeja.onboarding.model.entity.Property;
import co.ke.mkeja.onboarding.model.entity.PropertyUnit;
import co.ke.mkeja.onboarding.model.enums.UnitStatus;
import co.ke.mkeja.onboarding.repository.PropertyUnitRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class HouseHuntService {

    private final PropertyUnitRepository propertyUnitRepository;

    @Transactional
    public void syncPropertyListings(Property property) {
        List<PropertyUnit> units = propertyUnitRepository.findByPropertyId(property.getId());
        for (PropertyUnit unit : units) {
            applyListingRules(property, unit);
            propertyUnitRepository.save(unit);
        }
    }

    @Transactional
    public void syncUnitListing(Property property, PropertyUnit unit) {
        applyListingRules(property, unit);
        propertyUnitRepository.save(unit);
    }

    private void applyListingRules(Property property, PropertyUnit unit) {
        if (property.isHouseHuntEnabled()
                && property.isVerified()
                && unit.getStatus() == UnitStatus.VACANT) {
            unit.setDiscoverable(true);
            unit.setAutoRecommend(property.isAutoRecommendEnabled());
        } else {
            if (unit.getStatus() != UnitStatus.VACANT) {
                unit.setDiscoverable(false);
            } else if (!property.isHouseHuntEnabled()) {
                unit.setDiscoverable(false);
            }
            if (!property.isAutoRecommendEnabled()) {
                unit.setAutoRecommend(false);
            } else if (unit.isDiscoverable() && unit.getStatus() == UnitStatus.VACANT) {
                unit.setAutoRecommend(true);
            }
        }
    }
}

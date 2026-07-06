package co.ke.mkeja.onboarding.service;

import co.ke.mkeja.onboarding.dto.response.TenantTenancyHistoryResponse;
import co.ke.mkeja.onboarding.model.entity.Tenancy;
import co.ke.mkeja.onboarding.model.entity.User;
import co.ke.mkeja.onboarding.repository.TenancyRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class TenantTenancyService {

    private final TenancyRepository tenancyRepository;

    @Transactional(readOnly = true)
    public TenantTenancyHistoryResponse getTenancyHistory(User user) {
        List<TenantTenancyHistoryResponse.TenantTenancyItem> items =
                tenancyRepository.findAllByTenantUserId(user.getId()).stream()
                        .map(this::toItem)
                        .toList();
        return TenantTenancyHistoryResponse.builder()
                .tenancies(items)
                .build();
    }

    private TenantTenancyHistoryResponse.TenantTenancyItem toItem(Tenancy tenancy) {
        var unit = tenancy.getUnit();
        var property = unit != null ? unit.getProperty() : null;
        var owner = property != null && property.getOwner() != null ? property.getOwner().getUser() : null;
        return TenantTenancyHistoryResponse.TenantTenancyItem.builder()
                .tenancyId(tenancy.getId())
                .propertyName(property != null ? property.getName() : null)
                .propertyAddress(property != null ? property.getAddress() : null)
                .unitNumber(unit != null ? unit.getUnitNumber() : null)
                .floorNumber(unit != null ? unit.getFloorNumber() : null)
                .wing(unit != null ? unit.getWing() : null)
                .status(tenancy.getStatus())
                .leaseStartDate(tenancy.getLeaseStartDate())
                .leaseEndDate(tenancy.getLeaseEndDate())
                .moveInDate(tenancy.getMoveInDate())
                .moveOutDate(tenancy.getMoveOutDate())
                .monthlyRent(tenancy.getMonthlyRent())
                .rentDueDay(tenancy.getRentDueDay())
                .landlordName(owner != null ? owner.getFullName() : null)
                .build();
    }
}

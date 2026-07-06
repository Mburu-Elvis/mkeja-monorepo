package co.ke.mkeja.onboarding.service;

import co.ke.mkeja.onboarding.dto.response.SupportContextOptionResponse;
import co.ke.mkeja.onboarding.dto.response.SupportPropertyOption;
import co.ke.mkeja.onboarding.dto.response.SupportTenancyOption;
import co.ke.mkeja.onboarding.model.entity.Agent;
import co.ke.mkeja.onboarding.model.entity.Property;
import co.ke.mkeja.onboarding.model.entity.PropertyOwner;
import co.ke.mkeja.onboarding.model.entity.Tenancy;
import co.ke.mkeja.onboarding.model.entity.User;
import co.ke.mkeja.onboarding.model.enums.UserType;
import co.ke.mkeja.onboarding.repository.PropertyRepository;
import co.ke.mkeja.onboarding.repository.TenancyRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class SupportContextService {

    private final TenancyRepository tenancyRepository;
    private final PropertyRepository propertyRepository;

    @Transactional(readOnly = true)
    public SupportContextOptionResponse getContextOptions(User user) {
        List<SupportTenancyOption> tenancies = new ArrayList<>();
        List<SupportPropertyOption> properties = new ArrayList<>();

        switch (user.getUserType()) {
            case TENANT -> tenancies = tenancyRepository.findAllByTenantUserId(user.getId()).stream()
                    .map(this::toTenancyOptionForTenant)
                    .toList();
            case PROPERTY_OWNER -> {
                tenancies = tenancyRepository.findAllByLandlordUserId(user.getId()).stream()
                        .map(this::toTenancyOptionForLandlord)
                        .toList();
                properties = propertyRepository.findByOwnerUserId(user.getId()).stream()
                        .map(this::toPropertyOption)
                        .toList();
            }
            case AGENT -> {
                tenancies = tenancyRepository.findAllDetailedByAgentUserId(user.getId()).stream()
                        .map(this::toTenancyOptionForAgent)
                        .toList();
                properties = propertyRepository.findByAgentUserId(user.getId()).stream()
                        .map(this::toPropertyOption)
                        .toList();
            }
            default -> {
                // Platform admins do not need context pickers.
            }
        }

        return SupportContextOptionResponse.builder()
                .tenancies(tenancies)
                .properties(properties)
                .build();
    }

    private SupportTenancyOption toTenancyOptionForTenant(Tenancy tenancy) {
        return SupportTenancyOption.builder()
                .tenancyId(tenancy.getId())
                .unitId(tenancy.getUnit().getId())
                .propertyId(tenancy.getUnit().getProperty().getId())
                .label(buildTenancyLabel(tenancy))
                .status(tenancy.getStatus())
                .build();
    }

    private SupportTenancyOption toTenancyOptionForLandlord(Tenancy tenancy) {
        String tenantName = tenancy.getTenant() != null && tenancy.getTenant().getUser() != null
                ? tenancy.getTenant().getUser().getFullName()
                : null;
        return SupportTenancyOption.builder()
                .tenancyId(tenancy.getId())
                .unitId(tenancy.getUnit().getId())
                .propertyId(tenancy.getUnit().getProperty().getId())
                .label(buildTenancyLabel(tenancy))
                .tenantName(tenantName)
                .status(tenancy.getStatus())
                .build();
    }

    private SupportTenancyOption toTenancyOptionForAgent(Tenancy tenancy) {
        return toTenancyOptionForLandlord(tenancy);
    }

    private SupportPropertyOption toPropertyOption(Property property) {
        PropertyOwner owner = property.getOwner();
        Agent agent = property.getAgent();
        return SupportPropertyOption.builder()
                .propertyId(property.getId())
                .label(property.getName())
                .ownerName(owner != null && owner.getUser() != null ? owner.getUser().getFullName() : null)
                .agentName(agent != null && agent.getUser() != null ? agent.getUser().getFullName() : null)
                .hasAgent(agent != null)
                .build();
    }

    private String buildTenancyLabel(Tenancy tenancy) {
        String propertyName = tenancy.getUnit().getProperty().getName();
        return propertyName + " · Unit " + tenancy.getUnit().getUnitNumber();
    }
}

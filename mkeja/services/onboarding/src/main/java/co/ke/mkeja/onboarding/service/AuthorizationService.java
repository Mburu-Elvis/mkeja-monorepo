package co.ke.mkeja.onboarding.service;

import co.ke.mkeja.onboarding.exception.BadRequestException;
import co.ke.mkeja.onboarding.exception.ResourceNotFoundException;
import co.ke.mkeja.onboarding.model.entity.Agent;
import co.ke.mkeja.onboarding.model.entity.Property;
import co.ke.mkeja.onboarding.model.entity.PropertyOwner;
import co.ke.mkeja.onboarding.model.entity.PropertyUnit;
import co.ke.mkeja.onboarding.model.entity.User;
import co.ke.mkeja.onboarding.model.enums.KycStatus;
import co.ke.mkeja.onboarding.model.enums.RoleName;
import co.ke.mkeja.onboarding.model.enums.RoleScopeType;
import co.ke.mkeja.onboarding.repository.AgentRepository;
import co.ke.mkeja.onboarding.repository.PropertyOwnerRepository;
import co.ke.mkeja.onboarding.repository.PropertyRepository;
import co.ke.mkeja.onboarding.repository.PropertyUnitRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AuthorizationService {

    private final RoleService roleService;
    private final PropertyOwnerRepository propertyOwnerRepository;
    private final AgentRepository agentRepository;
    private final PropertyRepository propertyRepository;
    private final PropertyUnitRepository propertyUnitRepository;

    public PropertyOwner requireVerifiedLandlord(User user) {
        PropertyOwner owner = propertyOwnerRepository.findByUserId(user.getId())
                .orElseThrow(() -> new BadRequestException("Complete landlord KYC before performing this action"));
        if (owner.getKycStatus() != KycStatus.APPROVED && owner.getKycStatus() != KycStatus.VERIFIED) {
            throw new BadRequestException("Landlord KYC must be approved before performing this action");
        }
        return owner;
    }

    public Agent requireVerifiedAgent(User user) {
        Agent agent = agentRepository.findByUserId(user.getId())
                .orElseThrow(() -> new BadRequestException("Complete agent KYC before performing this action"));
        if (agent.getKycStatus() != KycStatus.APPROVED && agent.getKycStatus() != KycStatus.VERIFIED) {
            throw new BadRequestException("Agent KYC must be approved before performing this action");
        }
        return agent;
    }

    public List<Property> listAccessibleProperties(User user) {
        List<Property> properties = new ArrayList<>();
        if (roleService.isPropertyOwner(user)) {
            properties.addAll(propertyRepository.findByOwnerUserId(user.getId()));
        }
        if (!roleService.getScopedPropertyIds(user).isEmpty()) {
            propertyRepository.findAllById(roleService.getScopedPropertyIds(user)).forEach(property -> {
                if (property.getDeletedAt() != null) {
                    return;
                }
                if (properties.stream().noneMatch(existing -> existing.getId().equals(property.getId()))) {
                    properties.add(property);
                }
            });
        }
        return properties;
    }

    public boolean canAccessProperty(User user, Property property) {
        if (property == null) {
            return false;
        }
        if (roleService.isPropertyOwner(user)
                && property.getOwner().getUser().getId().equals(user.getId())) {
            return true;
        }
        return roleService.hasScopedRole(user, RoleName.AGENT, RoleScopeType.PROPERTY, property.getId());
    }

    public Property requirePropertyAccess(User user, Long propertyId) {
        Property property = propertyRepository.findById(propertyId)
                .orElseThrow(() -> new ResourceNotFoundException("Property not found"));
        if (property.getDeletedAt() != null) {
            throw new ResourceNotFoundException("Property not found");
        }
        if (!canAccessProperty(user, property)) {
            throw new BadRequestException("You do not have access to this property");
        }
        return property;
    }

    public Property requireOwnedProperty(User user, Long propertyId) {
        Property property = propertyRepository.findById(propertyId)
                .orElseThrow(() -> new ResourceNotFoundException("Property not found"));
        if (property.getDeletedAt() != null) {
            throw new ResourceNotFoundException("Property not found");
        }
        if (!property.getOwner().getUser().getId().equals(user.getId())) {
            throw new BadRequestException("You do not own this property");
        }
        return property;
    }

    public PropertyUnit requireUnitAccess(User user, Long unitId) {
        PropertyUnit unit = propertyUnitRepository.findById(unitId)
                .orElseThrow(() -> new ResourceNotFoundException("Unit not found"));
        requirePropertyAccess(user, unit.getProperty().getId());
        return unit;
    }

    public PropertyUnit requireOwnedUnit(User user, Long unitId) {
        PropertyUnit unit = propertyUnitRepository.findById(unitId)
                .orElseThrow(() -> new ResourceNotFoundException("Unit not found"));
        if (!unit.getProperty().getOwner().getUser().getId().equals(user.getId())) {
            throw new BadRequestException("You do not own this unit");
        }
        return unit;
    }

    public PropertyUnit requireOwnedUnit(PropertyOwner owner, Long unitId) {
        PropertyUnit unit = propertyUnitRepository.findById(unitId)
                .orElseThrow(() -> new ResourceNotFoundException("Unit not found"));
        if (!unit.getProperty().getOwner().getId().equals(owner.getId())) {
            throw new BadRequestException("You do not own this unit");
        }
        return unit;
    }

    public boolean ownsResource(User user, Long ownerUserId) {
        return user.getId().equals(ownerUserId);
    }

    public boolean canManageProperty(User user, Long propertyId) {
        if (!roleService.isPropertyOwner(user)) {
            return false;
        }
        Property property = propertyRepository.findById(propertyId).orElse(null);
        return property != null && property.getDeletedAt() == null
                && property.getOwner().getUser().getId().equals(user.getId());
    }
}

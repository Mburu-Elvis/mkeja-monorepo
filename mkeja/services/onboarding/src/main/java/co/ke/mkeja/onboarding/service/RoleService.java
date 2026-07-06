package co.ke.mkeja.onboarding.service;

import co.ke.mkeja.onboarding.model.entity.Role;
import co.ke.mkeja.onboarding.model.entity.User;
import co.ke.mkeja.onboarding.model.enums.RoleName;
import co.ke.mkeja.onboarding.model.enums.RoleScopeType;
import co.ke.mkeja.onboarding.repository.RoleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class RoleService {

    private final RoleRepository roleRepository;

    public void grantRole(User user, RoleName roleName, String grantedBy) {
        user.setUserType(roleName.getUserType());
        user.getRoles().add(buildRole(user, roleName, null, null, grantedBy));
    }

    public void grantScopedRole(User user, RoleName roleName, RoleScopeType scopeType,
                                String scopeId, String grantedBy) {
        if (roleName == RoleName.AGENT) {
            user.setUserType(RoleName.AGENT.getUserType());
        }
        user.getRoles().add(buildRole(user, roleName, scopeType, scopeId, grantedBy));
    }

    public boolean hasRole(User user, RoleName roleName) {
        return user.getRoles().stream()
                .filter(this::isActive)
                .anyMatch(role -> roleName.name().equals(role.getName()) && role.getRoleScopeType() == null);
    }

    public boolean hasScopedRole(User user, RoleName roleName, RoleScopeType scopeType, Long scopeId) {
        String scopeKey = String.valueOf(scopeId);
        return user.getRoles().stream()
                .filter(this::isActive)
                .anyMatch(role -> roleName.name().equals(role.getName())
                        && scopeType.name().equals(role.getRoleScopeType())
                        && scopeKey.equals(role.getRoleScopeId()));
    }

    public boolean isLandlord(User user) {
        return hasRole(user, RoleName.PROPERTY_OWNER)
                || user.getRoles().stream()
                .filter(this::isActive)
                .anyMatch(role -> RoleName.AGENT.name().equals(role.getName()));
    }

    public boolean isPropertyOwner(User user) {
        return hasRole(user, RoleName.PROPERTY_OWNER);
    }

    public boolean isTenant(User user) {
        return hasRole(user, RoleName.TENANT);
    }

    public boolean isAdmin(User user) {
        return hasRole(user, RoleName.ADMIN) || hasRole(user, RoleName.SUPER_ADMIN);
    }

    public boolean isSuperAdmin(User user) {
        return hasRole(user, RoleName.SUPER_ADMIN);
    }

    public String toFrontendRole(User user) {
        if (isSuperAdmin(user)) {
            return "SUPER_ADMIN";
        }
        if (isAdmin(user)) {
            return "ADMIN";
        }
        if (hasRole(user, RoleName.AGENT) && !isPropertyOwner(user)) {
            return "AGENT";
        }
        if (isLandlord(user)) {
            return "LANDLORD";
        }
        return "TENANT";
    }

    public boolean matchesFrontendRole(User user, String roleFilter) {
        if (roleFilter == null || roleFilter.isBlank() || "all".equalsIgnoreCase(roleFilter)) {
            return true;
        }
        if ("ADMIN".equalsIgnoreCase(roleFilter)) {
            return isAdmin(user) && !isSuperAdmin(user);
        }
        if ("SUPER_ADMIN".equalsIgnoreCase(roleFilter)) {
            return isSuperAdmin(user);
        }
        if ("AGENT".equalsIgnoreCase(roleFilter)) {
            return hasRole(user, RoleName.AGENT) && !isPropertyOwner(user);
        }
        return toFrontendRole(user).equalsIgnoreCase(roleFilter);
    }

    public long countUsersWithRole(RoleName roleName) {
        return roleRepository.countDistinctUsersByRoleName(roleName.name());
    }

    public Set<Long> getScopedPropertyIds(User user) {
        return user.getRoles().stream()
                .filter(this::isActive)
                .filter(role -> RoleName.AGENT.name().equals(role.getName()))
                .filter(role -> RoleScopeType.PROPERTY.name().equals(role.getRoleScopeType()))
                .map(role -> Long.parseLong(role.getRoleScopeId()))
                .collect(Collectors.toSet());
    }

    private Role buildRole(User user, RoleName roleName, RoleScopeType scopeType,
                           String scopeId, String grantedBy) {
        Role role = new Role();
        role.setName(roleName.name());
        role.setUser(user);
        role.setGrantedBy(grantedBy);
        role.setActive(true);
        if (scopeType != null) {
            role.setRoleScopeType(scopeType.name());
            role.setRoleScopeId(scopeId);
        }
        return role;
    }

    private boolean isActive(Role role) {
        return role.isActive()
                && (role.getExpiresAt() == null || role.getExpiresAt().isAfter(LocalDateTime.now()));
    }
}

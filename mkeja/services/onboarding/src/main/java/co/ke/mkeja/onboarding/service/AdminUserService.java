package co.ke.mkeja.onboarding.service;

import co.ke.mkeja.onboarding.dto.request.AdminUserUpdateRequest;
import co.ke.mkeja.onboarding.dto.response.AdminPropertySummaryResponse;
import co.ke.mkeja.onboarding.dto.response.AdminTenancySummaryResponse;
import co.ke.mkeja.onboarding.dto.response.AdminUserDetailResponse;
import co.ke.mkeja.onboarding.dto.response.AdminUserSummaryResponse;
import co.ke.mkeja.onboarding.dto.response.UserProfileResponse;
import co.ke.mkeja.onboarding.exception.ResourceNotFoundException;
import co.ke.mkeja.onboarding.mapper.EntityMapper;
import co.ke.mkeja.onboarding.model.entity.Agent;
import co.ke.mkeja.onboarding.model.entity.Property;
import co.ke.mkeja.onboarding.model.entity.PropertyOwner;
import co.ke.mkeja.onboarding.model.entity.PropertyUnit;
import co.ke.mkeja.onboarding.repository.projection.AdminTenancyRow;
import co.ke.mkeja.onboarding.model.entity.Tenant;
import co.ke.mkeja.onboarding.model.entity.User;
import co.ke.mkeja.onboarding.model.enums.KycStatus;
import co.ke.mkeja.onboarding.model.enums.RoleName;
import co.ke.mkeja.onboarding.model.enums.TenancyStatus;
import co.ke.mkeja.onboarding.model.enums.UnitStatus;
import co.ke.mkeja.onboarding.repository.AgentRepository;
import co.ke.mkeja.onboarding.repository.PropertyOwnerRepository;
import co.ke.mkeja.onboarding.repository.PropertyUnitRepository;
import co.ke.mkeja.onboarding.repository.TenancyRepository;
import co.ke.mkeja.onboarding.repository.TenantRepository;
import co.ke.mkeja.onboarding.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AdminUserService {

    private final UserRepository userRepository;
    private final TenantRepository tenantRepository;
    private final PropertyOwnerRepository propertyOwnerRepository;
    private final AgentRepository agentRepository;
    private final PropertyUnitRepository propertyUnitRepository;
    private final TenancyRepository tenancyRepository;
    private final RoleService roleService;
    private final AuthorizationService authorizationService;
    private final UserProfileService userProfileService;

    @Transactional(readOnly = true)
    public List<AdminUserSummaryResponse> listUsers(String role, String status, String search, String kycStatus) {
        return userRepository.findAll().stream()
                .sorted(Comparator.comparing(User::getCreatedAt, Comparator.nullsLast(Comparator.reverseOrder())))
                .filter(user -> matchesRole(user, role))
                .filter(user -> matchesStatus(user, status))
                .filter(user -> matchesKycStatus(user, kycStatus))
                .filter(user -> matchesSearch(user, search))
                .map(this::toSummary)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public AdminUserDetailResponse getUser(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        return toDetail(user);
    }

    @Transactional
    public AdminUserDetailResponse updateUser(Long userId, AdminUserUpdateRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (request.getFullName() != null && !request.getFullName().isBlank()) {
            String[] parts = request.getFullName().trim().split("\\s+", 2);
            user.setFirstName(parts[0]);
            user.setLastName(parts.length > 1 ? parts[1] : "");
        }
        if (request.getEmail() != null) {
            user.setEmail(request.getEmail().isBlank() ? null : request.getEmail().trim());
        }

        return toDetail(userRepository.save(user));
    }

    @Transactional
    public AdminUserDetailResponse toggleUserStatus(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        user.setActive(!user.isActive());
        if (!user.isActive()) {
            user.setLocked(true);
            user.setLockReason("Suspended by admin");
        } else {
            user.setLocked(false);
            user.setLockReason(null);
        }
        return toDetail(userRepository.save(user));
    }

    private AdminUserSummaryResponse toSummary(User user) {
        KycStatus kycStatus = resolveKycStatus(user);
        Integer propertyCount = null;
        Integer tenantCount = null;
        Integer tenancyCount = null;

        if (roleService.isLandlord(user)) {
            List<Property> properties = authorizationService.listAccessibleProperties(user);
            propertyCount = properties.size();
            if (roleService.isPropertyOwner(user)) {
                tenantCount = (int) tenancyRepository.countDistinctTenantsByLandlordUserId(
                        user.getId(), TenancyStatus.ACTIVE);
            }
        } else if (roleService.isTenant(user)) {
            tenancyCount = (int) tenancyRepository.countByTenantUserId(user.getId());
        }

        return AdminUserSummaryResponse.builder()
                .id(String.valueOf(user.getId()))
                .fullName(user.getFullName())
                .phone(user.getPhone())
                .email(user.getEmail())
                .role(roleService.toFrontendRole(user))
                .status(user.isActive() ? "active" : "suspended")
                .kycStatus(EntityMapper.toFrontendKycStatus(kycStatus))
                .joinedDate(user.getCreatedAt())
                .lastLoginAt(user.getLastLoginAt())
                .propertyCount(propertyCount)
                .tenantCount(tenantCount)
                .tenancyCount(tenancyCount)
                .build();
    }

    private AdminUserDetailResponse toDetail(User user) {
        UserProfileResponse profile = userProfileService.buildProfile(user);
        List<AdminPropertySummaryResponse> properties = new ArrayList<>();
        List<AdminTenancySummaryResponse> tenancies = new ArrayList<>();
        int unitCount = profile.getUnitCount() != null ? profile.getUnitCount() : 0;
        int activeTenancyCount = profile.getActiveTenancyCount() != null ? profile.getActiveTenancyCount() : 0;

        if (roleService.isLandlord(user)) {
            List<Property> ownerProperties = authorizationService.listAccessibleProperties(user);
            for (Property property : ownerProperties) {
                List<PropertyUnit> units = propertyUnitRepository.findByPropertyId(property.getId());
                long occupied = units.stream().filter(u -> u.getStatus() == UnitStatus.OCCUPIED).count();
                properties.add(AdminPropertySummaryResponse.builder()
                        .id(property.getId())
                        .name(property.getName())
                        .address(property.getAddress())
                        .city(property.getCity())
                        .status(property.getPropertyStatus() != null ? property.getPropertyStatus().name() : null)
                        .totalUnits(units.size())
                        .occupiedUnits((int) occupied)
                        .build());
            }
            if (roleService.isPropertyOwner(user)) {
                tenancies = tenancyRepository.findAdminSummariesByLandlordUserId(user.getId()).stream()
                        .map(this::toTenancySummary)
                        .collect(Collectors.toList());
            } else {
                Set<Long> propertyIds = ownerProperties.stream().map(Property::getId).collect(Collectors.toSet());
                tenancies = propertyIds.isEmpty() ? List.of() : tenancyRepository.findAdminSummariesByPropertyIds(propertyIds).stream()
                        .map(this::toTenancySummary)
                        .collect(Collectors.toList());
            }
            activeTenancyCount = (int) tenancies.stream()
                    .filter(t -> TenancyStatus.ACTIVE.name().equalsIgnoreCase(t.getStatus()))
                    .count();
        } else if (roleService.isTenant(user)) {
            tenancies = tenancyRepository.findAdminSummariesByTenantUserId(user.getId()).stream()
                    .map(this::toTenancySummary)
                    .collect(Collectors.toList());
            activeTenancyCount = (int) tenancies.stream()
                    .filter(t -> TenancyStatus.ACTIVE.name().equalsIgnoreCase(t.getStatus()))
                    .count();
        }

        return AdminUserDetailResponse.builder()
                .id(profile.getId())
                .fullName(profile.getFullName())
                .firstName(profile.getFirstName())
                .lastName(profile.getLastName())
                .phone(profile.getPhone())
                .email(profile.getEmail())
                .role(profile.getRole())
                .status(profile.getStatus())
                .kycStatus(profile.getKycStatus())
                .kycVerifiedAt(profile.getKycVerifiedAt())
                .joinedDate(profile.getJoinedDate())
                .lastLoginAt(profile.getLastLoginAt())
                .otpVerified(profile.getOtpVerified())
                .lockReason(profile.getLockReason())
                .idType(profile.getIdType())
                .idNumber(profile.getIdNumber())
                .idVerified(profile.getIdVerified())
                .gender(profile.getGender())
                .entityType(profile.getEntityType())
                .ownerSubtype(profile.getOwnerSubtype())
                .agentType(profile.getAgentType())
                .companyName(profile.getCompanyName())
                .companyRegistrationNumber(profile.getCompanyRegistrationNumber())
                .registrationNumber(profile.getRegistrationNumber())
                .kraPin(profile.getKraPin())
                .licenseNumber(profile.getLicenseNumber())
                .licenseExpiry(profile.getLicenseExpiry())
                .physicalAddress(profile.getPhysicalAddress())
                .city(profile.getCity())
                .county(profile.getCounty())
                .website(profile.getWebsite())
                .propertyCount(profile.getPropertyCount())
                .unitCount(unitCount)
                .tenantCount(profile.getTenantCount())
                .tenancyCount(profile.getTenancyCount())
                .activeTenancyCount(activeTenancyCount)
                .kycDocuments(profile.getKycDocuments())
                .properties(properties)
                .tenancies(tenancies)
                .build();
    }

    private AdminTenancySummaryResponse toTenancySummary(AdminTenancyRow row) {
        return AdminTenancySummaryResponse.builder()
                .id(row.getId())
                .propertyId(row.getPropertyId())
                .unitId(row.getUnitId())
                .tenantUserId(row.getTenantUserId() != null ? String.valueOf(row.getTenantUserId()) : null)
                .tenantName(row.getTenantName())
                .propertyName(row.getPropertyName())
                .unitNumber(row.getUnitNumber())
                .status(row.getStatus())
                .monthlyRent(row.getMonthlyRent())
                .moveInDate(row.getMoveInDate())
                .leaseEndDate(row.getLeaseEndDate())
                .build();
    }

    private KycStatus resolveKycStatus(User user) {
        if (roleService.isTenant(user)) {
            return tenantRepository.findByUserId(user.getId())
                    .map(Tenant::getKycStatus)
                    .orElse(KycStatus.PENDING);
        }
        if (roleService.isPropertyOwner(user)) {
            return propertyOwnerRepository.findByUserId(user.getId())
                    .map(PropertyOwner::getKycStatus)
                    .orElse(KycStatus.PENDING);
        }
        if (roleService.hasRole(user, RoleName.AGENT)) {
            return agentRepository.findByUserId(user.getId())
                    .map(Agent::getKycStatus)
                    .orElse(KycStatus.PENDING);
        }
        return KycStatus.APPROVED;
    }

    private boolean matchesRole(User user, String role) {
        return roleService.matchesFrontendRole(user, role);
    }

    private boolean matchesStatus(User user, String status) {
        if (status == null || status.isBlank() || "all".equalsIgnoreCase(status)) {
            return true;
        }
        String userStatus = user.isActive() ? "active" : "suspended";
        return userStatus.equalsIgnoreCase(status);
    }

    private boolean matchesKycStatus(User user, String kycStatus) {
        if (kycStatus == null || kycStatus.isBlank() || "all".equalsIgnoreCase(kycStatus)) {
            return true;
        }
        String resolved = EntityMapper.toFrontendKycStatus(resolveKycStatus(user));
        return resolved.equalsIgnoreCase(kycStatus.replace('-', '_'));
    }

    private boolean matchesSearch(User user, String search) {
        if (search == null || search.isBlank()) {
            return true;
        }
        String term = search.toLowerCase(Locale.ROOT);
        return user.getFullName().toLowerCase(Locale.ROOT).contains(term)
                || user.getPhone().contains(term)
                || (user.getEmail() != null && user.getEmail().toLowerCase(Locale.ROOT).contains(term));
    }
}

package co.ke.mkeja.onboarding.service.support;

import co.ke.mkeja.onboarding.exception.BadRequestException;
import co.ke.mkeja.onboarding.exception.ResourceNotFoundException;
import co.ke.mkeja.onboarding.model.entity.Agent;
import co.ke.mkeja.onboarding.model.entity.Property;
import co.ke.mkeja.onboarding.model.entity.PropertyOwner;
import co.ke.mkeja.onboarding.model.entity.Tenancy;
import co.ke.mkeja.onboarding.model.entity.User;
import co.ke.mkeja.onboarding.model.enums.SupportRoutingTarget;
import co.ke.mkeja.onboarding.model.enums.UserType;
import co.ke.mkeja.onboarding.repository.PropertyRepository;
import co.ke.mkeja.onboarding.repository.TenancyRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.Set;

@Component
@RequiredArgsConstructor
public class SupportTicketRouter {

    private static final Set<String> PLATFORM_CATEGORIES = Set.of(
            "payment_platform",
            "fuliza",
            "ratiba",
            "account",
            "account_kyc",
            "kyc",
            "technical",
            "system",
            "remittances",
            "remittances_payout",
            "invitation",
            "other"
    );

    private static final Set<String> TENANT_UNIT_CATEGORIES = Set.of(
            "unit_maintenance",
            "unit_lease",
            "unit_access",
            "unit_issue",
            "payment_rent"
    );

    private final TenancyRepository tenancyRepository;
    private final PropertyRepository propertyRepository;

    public SupportRoutingDecision route(
            User requester,
            String category,
            Long tenancyId,
            Long unitId,
            Long propertyId) {
        String normalizedCategory = mapCategory(category);
        UserType role = requester.getUserType();

        if (PLATFORM_CATEGORIES.contains(normalizedCategory)) {
            return platformDecision(normalizedCategory, null, tenancyId, unitId, propertyId);
        }

        return switch (role) {
            case TENANT -> routeTenantIssue(requester, normalizedCategory, tenancyId);
            case PROPERTY_OWNER -> routeLandlordIssue(requester, normalizedCategory, tenancyId, propertyId);
            case AGENT -> routeAgentIssue(requester, normalizedCategory, tenancyId, propertyId);
            default -> platformDecision(normalizedCategory, null, tenancyId, unitId, propertyId);
        };
    }

    private SupportRoutingDecision routeTenantIssue(User requester, String category, Long tenancyId) {
        if (TENANT_UNIT_CATEGORIES.contains(category) || "payment".equals(category)) {
            if (tenancyId == null) {
                throw new BadRequestException("Select the unit this issue is about before submitting.");
            }
            Tenancy tenancy = loadTenancyForTenant(requester, tenancyId);
            return routeFromTenancy(tenancy, category, requester);
        }
        return platformDecision(category, null, tenancyId, null, null);
    }

    private SupportRoutingDecision routeLandlordIssue(
            User requester,
            String category,
            Long tenancyId,
            Long propertyId) {
        return switch (category) {
            case "agent_coordination" -> {
                if (propertyId == null) {
                    throw new BadRequestException("Select the property this issue relates to.");
                }
                Property property = loadPropertyForLandlord(requester, propertyId);
                yield routeToAgent(property, category, requester.getFullName());
            }
            case "tenant_dispute", "tenant_issue" -> {
                if (tenancyId != null) {
                    Tenancy tenancy = loadTenancyForLandlord(requester, tenancyId);
                    yield platformDecision(
                            category,
                            "Tenant disputes involving platform records are reviewed by Mkeja",
                            tenancy.getId(),
                            tenancy.getUnit().getId(),
                            tenancy.getUnit().getProperty().getId());
                }
                yield platformDecision(category, "Escalated to Mkeja for mediation", null, null, propertyId);
            }
            case "properties", "property_setup" -> platformDecision(
                    category,
                    "Property setup issues on the platform are handled by Mkeja",
                    null,
                    null,
                    propertyId);
            default -> platformDecision(category, null, tenancyId, null, propertyId);
        };
    }

    private SupportRoutingDecision routeAgentIssue(
            User requester,
            String category,
            Long tenancyId,
            Long propertyId) {
        return switch (category) {
            case "owner_coordination" -> {
                if (propertyId == null) {
                    throw new BadRequestException("Select the property this issue relates to.");
                }
                Property property = loadPropertyForAgent(requester, propertyId);
                yield routeToLandlord(property, category, requester.getFullName());
            }
            case "tenant_issue", "tenant_management" -> {
                if (tenancyId == null) {
                    throw new BadRequestException("Select the tenant tenancy this issue is about.");
                }
                Tenancy tenancy = loadTenancyForAgent(requester, tenancyId);
                yield SupportRoutingDecision.builder()
                        .routingTarget(SupportRoutingTarget.AGENT)
                        .assignedUser(requester)
                        .routingReason("Tracked under your managed tenancy")
                        .contextLabel(buildTenancyLabel(tenancy))
                        .tenancyId(tenancy.getId())
                        .unitId(tenancy.getUnit().getId())
                        .propertyId(tenancy.getUnit().getProperty().getId())
                        .acknowledgementMessage(
                                "Your ticket has been logged. Coordinate with the tenant or escalate to Mkeja if needed.")
                        .build();
            }
            default -> platformDecision(category, null, tenancyId, null, propertyId);
        };
    }

    private SupportRoutingDecision routeFromTenancy(Tenancy tenancy, String category, User requester) {
        Property property = tenancy.getUnit().getProperty();
        Agent agent = property.getAgent();
        User landlord = property.getOwner().getUser();

        boolean operationalIssue = TENANT_UNIT_CATEGORIES.contains(category);
        if (agent != null && operationalIssue) {
            return SupportRoutingDecision.builder()
                    .routingTarget(SupportRoutingTarget.AGENT)
                    .assignedUser(agent.getUser())
                    .routingReason("Unit issues are handled by the property's managing agent")
                    .contextLabel(buildTenancyLabel(tenancy))
                    .tenancyId(tenancy.getId())
                    .unitId(tenancy.getUnit().getId())
                    .propertyId(property.getId())
                    .acknowledgementMessage(
                            "Your property agent (" + agent.getUser().getFullName()
                                    + ") has been notified about " + buildTenancyLabel(tenancy) + ".")
                    .build();
        }

        return SupportRoutingDecision.builder()
                .routingTarget(SupportRoutingTarget.LANDLORD)
                .assignedUser(landlord)
                .routingReason("Unit issues are handled by your landlord")
                .contextLabel(buildTenancyLabel(tenancy))
                .tenancyId(tenancy.getId())
                .unitId(tenancy.getUnit().getId())
                .propertyId(property.getId())
                .acknowledgementMessage(
                        "Your landlord (" + landlord.getFullName()
                                + ") has been notified about " + buildTenancyLabel(tenancy) + ".")
                .build();
    }

    private SupportRoutingDecision routeToAgent(Property property, String category, String requesterName) {
        Agent agent = property.getAgent();
        if (agent == null) {
            throw new BadRequestException("This property has no assigned agent on Mkeja.");
        }
        return SupportRoutingDecision.builder()
                .routingTarget(SupportRoutingTarget.AGENT)
                .assignedUser(agent.getUser())
                .routingReason("Landlord coordination with assigned agent")
                .contextLabel(property.getName())
                .propertyId(property.getId())
                .acknowledgementMessage(
                        "Your agent (" + agent.getUser().getFullName()
                                + ") has been notified about " + property.getName() + ".")
                .build();
    }

    private SupportRoutingDecision routeToLandlord(Property property, String category, String requesterName) {
        User landlord = property.getOwner().getUser();
        return SupportRoutingDecision.builder()
                .routingTarget(SupportRoutingTarget.LANDLORD)
                .assignedUser(landlord)
                .routingReason("Agent coordination with property owner")
                .contextLabel(property.getName())
                .propertyId(property.getId())
                .acknowledgementMessage(
                        "The property owner (" + landlord.getFullName()
                                + ") has been notified about " + property.getName() + ".")
                .build();
    }

    private SupportRoutingDecision platformDecision(
            String category,
            String reason,
            Long tenancyId,
            Long unitId,
            Long propertyId) {
        String routingReason = reason != null ? reason : "Handled by the Mkeja platform team";
        return SupportRoutingDecision.builder()
                .routingTarget(SupportRoutingTarget.PLATFORM)
                .assignedUser(null)
                .routingReason(routingReason)
                .contextLabel(null)
                .tenancyId(tenancyId)
                .unitId(unitId)
                .propertyId(propertyId)
                .acknowledgementMessage(
                        "Thanks for contacting Mkeja. Our platform team has received your ticket and will respond within 2 business hours.")
                .build();
    }

    private Tenancy loadTenancyForTenant(User requester, Long tenancyId) {
        return tenancyRepository.findDetailedByIdAndTenantUserId(tenancyId, requester.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Tenancy not found for your account"));
    }

    private Tenancy loadTenancyForLandlord(User requester, Long tenancyId) {
        return tenancyRepository.findDetailedByIdAndLandlordUserId(tenancyId, requester.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Tenancy not found on your properties"));
    }

    private Tenancy loadTenancyForAgent(User requester, Long tenancyId) {
        return tenancyRepository.findDetailedByIdAndAgentUserId(tenancyId, requester.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Tenancy not found on your managed properties"));
    }

    private Property loadPropertyForLandlord(User requester, Long propertyId) {
        return propertyRepository.findByIdAndOwnerUserId(propertyId, requester.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Property not found on your account"));
    }

    private Property loadPropertyForAgent(User requester, Long propertyId) {
        return propertyRepository.findByIdAndAgentUserId(propertyId, requester.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Property not found in your portfolio"));
    }

    private String buildTenancyLabel(Tenancy tenancy) {
        Property property = tenancy.getUnit().getProperty();
        String propertyName = property != null ? property.getName() : "Property";
        String unitNumber = tenancy.getUnit().getUnitNumber();
        return propertyName + " · Unit " + unitNumber;
    }

    private String normalize(String category) {
        return category == null ? "other" : category.trim().toLowerCase();
    }

    private String mapCategory(String category) {
        return switch (normalize(category)) {
            case "payment" -> "payment_platform";
            case "account" -> "account_kyc";
            case "technical" -> "system";
            case "properties" -> "property_setup";
            case "tenants" -> "tenant_issue";
            case "remittances" -> "remittances_payout";
            default -> normalize(category);
        };
    }
}

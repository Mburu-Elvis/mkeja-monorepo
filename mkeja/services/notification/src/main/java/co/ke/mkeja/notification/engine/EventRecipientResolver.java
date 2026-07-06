package co.ke.mkeja.notification.engine;

import co.ke.mkeja.notification.dto.PlatformEventRequest;
import co.ke.mkeja.notification.model.enums.DeliveryChannel;
import co.ke.mkeja.notification.model.enums.NotificationCategory;
import co.ke.mkeja.notification.model.enums.NotificationType;
import jakarta.persistence.EntityManager;
import jakarta.persistence.NoResultException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.*;

@Component
@RequiredArgsConstructor
public class EventRecipientResolver {

    private final EntityManager entityManager;

    public List<NotificationDraft> resolve(PlatformEventRequest event) {
        return switch (event.getEventType()) {
            case "INVITATION_SENT" -> resolveInvitationSent(event);
            case "INVITATION_ACCEPTED" -> resolveInvitationAccepted(event);
            case "TENANT_ONBOARDED" -> resolveTenantOnboarded(event);
            case "LEASE_SIGNED" -> resolveLeaseSigned(event);
            case "TENANCY_CREATED" -> resolveTenancyCreated(event);
            case "TENANCY_TERMINATED" -> resolveTenancyTerminated(event);
            case "PROPERTY_VERIFIED" -> resolvePropertyVerified(event);
            case "PROPERTY_CREATED" -> resolvePropertyCreated(event);
            case "UNIT_CREATED" -> resolveUnitCreated(event);
            case "LISTING_UPDATED" -> resolveListingUpdated(event);
            case "KYC_VERIFIED" -> resolveKycVerified(event);
            case "KYC_REJECTED" -> resolveKycRejected(event);
            case "LISTING_INTEREST_CREATED" -> resolveListingInterest(event);
            case "LANDLORD_REGISTERED" -> resolveLandlordRegistered(event);
            default -> List.of();
        };
    }

    private List<NotificationDraft> resolveInvitationSent(PlatformEventRequest event) {
        Map<String, Object> payload = safePayload(event);
        String phone = stringValue(payload.get("phone"));
        Long unitId = longValue(payload.get("unitId"));
        List<NotificationDraft> drafts = new ArrayList<>();

        loadUserIdByPhone(phone).ifPresent(userId -> drafts.add(NotificationDraft.builder()
                .userId(userId)
                .title("New tenancy invitation")
                .message("You have been invited to a new unit. Open your invitations to accept.")
                .type(NotificationType.INFO)
                .category(NotificationCategory.ONBOARDING)
                .link("/tenant/onboarding/invitation")
                .channels(ChannelSets.INBOX_SMS)
                .build()));

        resolveLandlordForUnit(unitId).ifPresent(landlordUserId -> drafts.add(NotificationDraft.builder()
                .userId(landlordUserId)
                .title("Invitation sent")
                .message("Your tenant invitation has been sent successfully.")
                .type(NotificationType.SUCCESS)
                .category(NotificationCategory.ONBOARDING)
                .link("/landlord/tenants/invite")
                .channels(ChannelSets.INBOX)
                .build()));

        return drafts;
    }

    private List<NotificationDraft> resolveInvitationAccepted(PlatformEventRequest event) {
        Long tenantId = longValue(safePayload(event).get("tenantId"));
        return resolveTenantAndLandlordPair(tenantId,
                "Invitation accepted",
                "A tenant has accepted your invitation.",
                "You accepted the tenancy invitation.",
                "/landlord/tenants",
                "/tenant/onboarding/lease-sign",
                NotificationCategory.ONBOARDING);
    }

    private List<NotificationDraft> resolveTenantOnboarded(PlatformEventRequest event) {
        Map<String, Object> payload = safePayload(event);
        String phase = stringValue(payload.get("phase"));
        Long tenantId = longValue(payload.get("tenantId"));
        if (tenantId == null) {
            tenantId = longValue(event.getAggregateId());
        }

        if ("DOCUMENTS_UPLOADED".equals(phase)) {
            return resolveTenantOnly(tenantId,
                    "KYC documents submitted",
                    "Your identity documents have been submitted and are under review.",
                    NotificationType.INFO,
                    NotificationCategory.KYC,
                    "/tenant/onboarding");
        }

        if ("COMPLETED".equals(phase)) {
            return resolveTenantAndLandlordPair(tenantId,
                    "Tenant onboarding complete",
                    "Your tenant has completed onboarding.",
                    "Welcome to Mkeja! Your onboarding is complete.",
                    "/landlord/tenants",
                    "/tenant/dashboard",
                    NotificationCategory.ONBOARDING);
        }

        if ("REGISTERED".equals(phase)) {
            return resolveTenantOnly(tenantId,
                    "Registration complete",
                    "Continue with KYC verification and lease signing.",
                    NotificationType.SUCCESS,
                    NotificationCategory.ONBOARDING,
                    "/tenant/onboarding");
        }

        return List.of();
    }

    private List<NotificationDraft> resolveLeaseSigned(PlatformEventRequest event) {
        Long tenantId = longValue(safePayload(event).get("tenantId"));
        return resolveTenantAndLandlordPair(tenantId,
                "Lease signed",
                "Your tenant has signed the lease agreement.",
                "Your lease has been signed successfully.",
                "/landlord/tenants",
                "/tenant/onboarding/lease-sign",
                NotificationCategory.TENANCY);
    }

    private List<NotificationDraft> resolveTenancyCreated(PlatformEventRequest event) {
        Long tenantId = longValue(safePayload(event).get("tenantId"));
        return resolveTenantAndLandlordPair(tenantId,
                "Tenancy created",
                "A new tenancy has been created for your property.",
                "Your tenancy is now active. Welcome home!",
                "/landlord/tenants",
                "/tenant/dashboard",
                NotificationCategory.TENANCY);
    }

    private List<NotificationDraft> resolveTenancyTerminated(PlatformEventRequest event) {
        Long tenantId = longValue(safePayload(event).get("tenantId"));
        return resolveTenantAndLandlordPair(tenantId,
                "Tenancy terminated",
                "A tenancy on your property has been terminated.",
                "Your tenancy has been terminated.",
                "/landlord/tenants",
                "/tenant/dashboard",
                NotificationCategory.TENANCY);
    }

    private List<NotificationDraft> resolvePropertyVerified(PlatformEventRequest event) {
        Long propertyId = longValue(event.getAggregateId());
        return resolveLandlordForProperty(propertyId)
                .map(landlordUserId -> List.of(NotificationDraft.builder()
                        .userId(landlordUserId)
                        .title("Property verified")
                        .message("Your property has been verified and is ready for listings.")
                        .type(NotificationType.SUCCESS)
                        .category(NotificationCategory.PROPERTY)
                        .link("/landlord/properties")
                        .channels(ChannelSets.FULL)
                        .build()))
                .orElse(List.of());
    }

    private List<NotificationDraft> resolvePropertyCreated(PlatformEventRequest event) {
        Long propertyId = longValue(event.getAggregateId());
        return resolveLandlordForProperty(propertyId)
                .map(landlordUserId -> List.of(NotificationDraft.builder()
                        .userId(landlordUserId)
                        .title("Property created")
                        .message("Your property has been added. Complete verification to start listing units.")
                        .type(NotificationType.INFO)
                        .category(NotificationCategory.PROPERTY)
                        .link("/landlord/properties/" + propertyId)
                        .channels(ChannelSets.INBOX)
                        .build()))
                .orElse(List.of());
    }

    private List<NotificationDraft> resolveUnitCreated(PlatformEventRequest event) {
        Long unitId = longValue(safePayload(event).get("unitId"));
        if (unitId == null) {
            unitId = longValue(event.getAggregateId());
        }
        return resolveLandlordForUnit(unitId)
                .map(landlordUserId -> List.of(NotificationDraft.builder()
                        .userId(landlordUserId)
                        .title("Unit added")
                        .message("A new unit has been added to your property.")
                        .type(NotificationType.INFO)
                        .category(NotificationCategory.PROPERTY)
                        .link("/landlord/properties")
                        .channels(ChannelSets.INBOX)
                        .build()))
                .orElse(List.of());
    }

    private List<NotificationDraft> resolveListingUpdated(PlatformEventRequest event) {
        Long unitId = longValue(safePayload(event).get("unitId"));
        return resolveLandlordForUnit(unitId)
                .map(landlordUserId -> List.of(NotificationDraft.builder()
                        .userId(landlordUserId)
                        .title("Listing updated")
                        .message("Your unit listing settings have been updated.")
                        .type(NotificationType.INFO)
                        .category(NotificationCategory.DISCOVERY)
                        .link("/landlord/properties")
                        .channels(ChannelSets.INBOX)
                        .build()))
                .orElse(List.of());
    }

    private List<NotificationDraft> resolveKycVerified(PlatformEventRequest event) {
        Map<String, Object> payload = safePayload(event);
        String applicantType = stringValue(payload.get("applicantType"));
        Long userId = longValue(payload.get("userId"));
        if (userId == null) {
            return List.of();
        }

        String link = "TENANT".equalsIgnoreCase(applicantType) ? "/tenant/profile" : "/landlord/profile";
        return List.of(NotificationDraft.builder()
                .userId(userId)
                .title("KYC verification approved")
                .message("Your identity verification has been approved. You now have full access.")
                .type(NotificationType.SUCCESS)
                .category(NotificationCategory.KYC)
                .link(link)
                .channels(ChannelSets.FULL)
                .build());
    }

    private List<NotificationDraft> resolveKycRejected(PlatformEventRequest event) {
        Map<String, Object> payload = safePayload(event);
        String applicantType = stringValue(payload.get("applicantType"));
        Long userId = longValue(payload.get("userId"));
        if (userId == null) {
            return List.of();
        }

        String link = "TENANT".equalsIgnoreCase(applicantType) ? "/tenant/profile" : "/landlord/profile";
        return List.of(NotificationDraft.builder()
                .userId(userId)
                .title("KYC verification rejected")
                .message("Your identity verification was not approved. Please review and resubmit your documents.")
                .type(NotificationType.ERROR)
                .category(NotificationCategory.KYC)
                .link(link)
                .channels(ChannelSets.INBOX_SMS)
                .build());
    }

    private List<NotificationDraft> resolveListingInterest(PlatformEventRequest event) {
        Map<String, Object> payload = safePayload(event);
        Long landlordUserId = longValue(payload.get("landlordUserId"));
        String tenantName = stringValue(payload.get("tenantName"));
        String propertyName = stringValue(payload.get("propertyName"));
        String unitLabel = stringValue(payload.get("unitLabel"));

        if (landlordUserId == null) {
            return List.of();
        }

        String location = propertyName != null ? propertyName : "your listing";
        if (unitLabel != null && !unitLabel.isBlank()) {
            location = unitLabel + " at " + location;
        }

        String message = tenantName != null && !tenantName.isBlank()
                ? tenantName + " expressed interest in " + location + "."
                : "A prospective tenant expressed interest in " + location + ".";

        return List.of(NotificationDraft.builder()
                .userId(landlordUserId)
                .title("New house hunt lead")
                .message(message)
                .type(NotificationType.INFO)
                .category(NotificationCategory.DISCOVERY)
                .link("/landlord/leads")
                .channels(ChannelSets.INBOX_PUSH_SMS)
                .build());
    }

    private List<NotificationDraft> resolveLandlordRegistered(PlatformEventRequest event) {
        Long userId = longValue(safePayload(event).get("userId"));
        if (userId == null) {
            return List.of();
        }
        return List.of(NotificationDraft.builder()
                .userId(userId)
                .title("Welcome to Mkeja")
                .message("Your landlord account has been created. Complete KYC to start adding properties.")
                .type(NotificationType.SUCCESS)
                .category(NotificationCategory.ONBOARDING)
                .link("/landlord/dashboard")
                .channels(ChannelSets.INBOX)
                .build());
    }

    private List<NotificationDraft> resolveTenantAndLandlordPair(Long tenantId,
                                                                 String title,
                                                                 String landlordMessage,
                                                                 String tenantMessage,
                                                                 String landlordLink,
                                                                 String tenantLink,
                                                                 NotificationCategory category) {
        if (tenantId == null) {
            return List.of();
        }
        List<NotificationDraft> drafts = new ArrayList<>();
        resolveTenantUserId(tenantId).ifPresent(tenantUserId -> drafts.add(NotificationDraft.builder()
                .userId(tenantUserId)
                .title(title)
                .message(tenantMessage)
                .type(NotificationType.SUCCESS)
                .category(category)
                .link(tenantLink)
                .channels(ChannelSets.INBOX_PUSH_SMS)
                .build()));

        resolveLandlordForTenant(tenantId).ifPresent(landlordUserId -> drafts.add(NotificationDraft.builder()
                .userId(landlordUserId)
                .title(title)
                .message(landlordMessage)
                .type(NotificationType.INFO)
                .category(category)
                .link(landlordLink)
                .channels(ChannelSets.INBOX_PUSH)
                .build()));

        return drafts;
    }

    private List<NotificationDraft> resolveTenantOnly(Long tenantId,
                                                      String title,
                                                      String message,
                                                      NotificationType type,
                                                      NotificationCategory category,
                                                      String link) {
        if (tenantId == null) {
            return List.of();
        }
        return resolveTenantUserId(tenantId)
                .map(userId -> List.of(NotificationDraft.builder()
                        .userId(userId)
                        .title(title)
                        .message(message)
                        .type(type)
                        .category(category)
                        .link(link)
                        .channels(ChannelSets.INBOX)
                        .build()))
                .orElse(List.of());
    }

    private Optional<Long> loadUserIdByPhone(String phone) {
        if (phone == null || phone.isBlank()) {
            return Optional.empty();
        }
        String sql = "SELECT u.id FROM tbl_users u WHERE u.phone = :phone LIMIT 1";
        try {
            Number id = (Number) entityManager.createNativeQuery(sql)
                    .setParameter("phone", phone)
                    .getSingleResult();
            return Optional.of(id.longValue());
        } catch (NoResultException e) {
            return Optional.empty();
        }
    }

    private Optional<Long> resolveTenantUserId(Long tenantId) {
        String sql = "SELECT u.id FROM tbl_tenants t JOIN tbl_users u ON t.user_id = u.id WHERE t.id = :tenantId";
        try {
            Number id = (Number) entityManager.createNativeQuery(sql)
                    .setParameter("tenantId", tenantId)
                    .getSingleResult();
            return Optional.of(id.longValue());
        } catch (NoResultException e) {
            return Optional.empty();
        }
    }

    private Optional<Long> resolveLandlordForTenant(Long tenantId) {
        String sql = """
                SELECT po.user_id
                FROM tbl_tenancy ten
                JOIN tbl_property_unit u ON ten.unit_id = u.id
                JOIN tbl_properties p ON u.property_id = p.id
                JOIN tbl_property_owner po ON p.owner_id = po.id
                WHERE ten.tenant_id = :tenantId
                ORDER BY ten.created_at DESC
                LIMIT 1
                """;
        try {
            Number id = (Number) entityManager.createNativeQuery(sql)
                    .setParameter("tenantId", tenantId)
                    .getSingleResult();
            return Optional.of(id.longValue());
        } catch (NoResultException e) {
            return resolveLandlordFromInvitation(tenantId);
        }
    }

    private Optional<Long> resolveLandlordFromInvitation(Long tenantId) {
        String sql = """
                SELECT po.user_id
                FROM tbl_tenants t
                JOIN tbl_onboarding_session os ON os.user_id = t.user_id
                JOIN tbl_tenant_invitation inv ON inv.code = os.invitation_code
                JOIN tbl_property_owner po ON inv.landlord_id = po.id
                WHERE t.id = :tenantId
                LIMIT 1
                """;
        try {
            Number id = (Number) entityManager.createNativeQuery(sql)
                    .setParameter("tenantId", tenantId)
                    .getSingleResult();
            return Optional.of(id.longValue());
        } catch (NoResultException e) {
            return Optional.empty();
        }
    }

    private Optional<Long> resolveLandlordForUnit(Long unitId) {
        if (unitId == null) {
            return Optional.empty();
        }
        String sql = """
                SELECT po.user_id
                FROM tbl_property_unit u
                JOIN tbl_properties p ON u.property_id = p.id
                JOIN tbl_property_owner po ON p.owner_id = po.id
                WHERE u.id = :unitId
                """;
        try {
            Number id = (Number) entityManager.createNativeQuery(sql)
                    .setParameter("unitId", unitId)
                    .getSingleResult();
            return Optional.of(id.longValue());
        } catch (NoResultException e) {
            return Optional.empty();
        }
    }

    private Optional<Long> resolveLandlordForProperty(Long propertyId) {
        if (propertyId == null) {
            return Optional.empty();
        }
        String sql = """
                SELECT po.user_id
                FROM tbl_properties p
                JOIN tbl_property_owner po ON p.owner_id = po.id
                WHERE p.id = :propertyId
                """;
        try {
            Number id = (Number) entityManager.createNativeQuery(sql)
                    .setParameter("propertyId", propertyId)
                    .getSingleResult();
            return Optional.of(id.longValue());
        } catch (NoResultException e) {
            return Optional.empty();
        }
    }

    private Map<String, Object> safePayload(PlatformEventRequest event) {
        return event.getPayload() != null ? event.getPayload() : Map.of();
    }

    private String stringValue(Object value) {
        return value != null ? String.valueOf(value) : null;
    }

    private Long longValue(Object value) {
        if (value == null) {
            return null;
        }
        if (value instanceof Number number) {
            return number.longValue();
        }
        try {
            return Long.parseLong(String.valueOf(value));
        } catch (NumberFormatException e) {
            return null;
        }
    }
}

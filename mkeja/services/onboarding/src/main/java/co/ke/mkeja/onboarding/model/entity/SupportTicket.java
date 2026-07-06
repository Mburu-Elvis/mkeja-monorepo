package co.ke.mkeja.onboarding.model.entity;

import co.ke.mkeja.onboarding.model.enums.SupportRoutingTarget;
import co.ke.mkeja.onboarding.model.enums.SupportTicketPriority;
import co.ke.mkeja.onboarding.model.enums.SupportTicketStatus;
import co.ke.mkeja.onboarding.model.enums.UserType;
import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.ToString;

import java.util.ArrayList;
import java.util.List;

@Data
@EqualsAndHashCode(callSuper = true, exclude = {"user", "messages"})
@ToString(exclude = {"user", "messages"})
@Entity
@Table(name = "tbl_support_tickets")
public class SupportTicket extends BaseEntity {

    @Column(name = "reference_code", nullable = false, unique = true, length = 20)
    private String referenceCode;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(name = "portal_role", nullable = false, length = 30)
    private UserType portalRole;

    @Column(name = "subject", nullable = false, length = 120)
    private String subject;

    @Column(name = "category", nullable = false, length = 40)
    private String category;

    @Enumerated(EnumType.STRING)
    @Column(name = "priority", nullable = false, length = 20)
    private SupportTicketPriority priority = SupportTicketPriority.MEDIUM;

    @Column(name = "description", nullable = false, columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private SupportTicketStatus status = SupportTicketStatus.OPEN;

    @OneToMany(mappedBy = "ticket", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("createdAt ASC")
    private List<SupportTicketMessage> messages = new ArrayList<>();

    @Enumerated(EnumType.STRING)
    @Column(name = "routing_target", nullable = false, length = 20)
    private SupportRoutingTarget routingTarget = SupportRoutingTarget.PLATFORM;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assigned_user_id")
    private User assignedUser;

    @Column(name = "routing_reason", length = 255)
    private String routingReason;

    @Column(name = "context_label", length = 200)
    private String contextLabel;

    @Column(name = "tenancy_id")
    private Long tenancyId;

    @Column(name = "unit_id")
    private Long unitId;

    @Column(name = "property_id")
    private Long propertyId;

    @Column(name = "requester_name", length = 120)
    private String requesterName;
}

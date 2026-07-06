package co.ke.mkeja.onboarding.model.entity;

import co.ke.mkeja.onboarding.model.enums.InvitationStatus;
import co.ke.mkeja.onboarding.model.enums.PaymentPlan;
import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@EqualsAndHashCode(callSuper = true)
@Entity
@Table(name = "tbl_tenant_invitations")
public class TenantInvitation extends BaseEntity {
    @Column(name = "code", unique = true, nullable = false, length = 36)
    private String code;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "landlord_id", nullable = false)
    private User landlord;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "unit_id", nullable = false)
    private PropertyUnit unit;

    @Column(name = "tenant_phone", nullable = false, length = 12)
    private String tenantPhone;

    @Column(name = "tenant_email")
    private String tenantEmail;

    @Column(name = "tenant_name", nullable = false)
    private String tenantName;

    @Column(name = "monthly_rent", nullable = false)
    private Double monthlyRent;

    @Column(name = "deposit_amount")
    private Double depositAmount;

    @Enumerated(EnumType.STRING)
    @Column(name = "payment_plan", nullable = false)
    private PaymentPlan paymentPlan;

    @Column(name = "lease_start_date", nullable = false)
    private LocalDate leaseStartDate;

    @Column(name = "lease_end_date")
    private LocalDate leaseEndDate;

    /** Day of month (1-28) when landlord expects rent paid */
    @Column(name = "rent_due_day")
    private Integer rentDueDay;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "linked_tenant_id")
    private Tenant linkedTenant;

    @Column(name = "qr_code_url")
    private String qrCodeUrl;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private InvitationStatus status = InvitationStatus.PENDING;

    @Column(name = "expires_at", nullable = false)
    private LocalDateTime expiresAt;

    @Column(name = "accepted_at")
    private LocalDateTime acceptedAt;
}

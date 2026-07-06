package co.ke.mkeja.onboarding.model.entity;

import co.ke.mkeja.onboarding.model.enums.PaymentPlan;
import co.ke.mkeja.onboarding.model.enums.TenancyStatus;
import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@EqualsAndHashCode(callSuper = true)
@Entity
@Table(name = "tbl_tenancy")
public class Tenancy extends BaseEntity {
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tenant_id", nullable = false)
    private Tenant tenant;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "unit_id", nullable = false)
    private PropertyUnit unit;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "invitation_id")
    private TenantInvitation invitation;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "lease_id")
    private Lease lease;

    @Column(name = "move_in_date", nullable = false)
    private LocalDate moveInDate;

    @Column(name = "move_out_date")
    private LocalDate moveOutDate;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private TenancyStatus status = TenancyStatus.PENDING;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "onboarded_by_id")
    private User onboardedBy;

    @Enumerated(EnumType.STRING)
    @Column(name = "payment_plan")
    private PaymentPlan paymentPlan;

    @Column(name = "monthly_rent")
    private Double monthlyRent;

    @Column(name = "lease_start_date")
    private LocalDate leaseStartDate;

    @Column(name = "lease_end_date")
    private LocalDate leaseEndDate;

    /** Day of month when rent is due for this tenancy */
    @Column(name = "rent_due_day")
    private Integer rentDueDay;
}

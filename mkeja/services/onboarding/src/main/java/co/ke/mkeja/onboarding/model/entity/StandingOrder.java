package co.ke.mkeja.onboarding.model.entity;

import co.ke.mkeja.onboarding.model.enums.PaymentPlan;
import co.ke.mkeja.onboarding.model.enums.StandingOrderStatus;
import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
@EqualsAndHashCode(callSuper = true)
@Entity
@Table(name = "tbl_standing_orders")
public class StandingOrder extends BaseEntity {
    @ManyToOne
    @JoinColumn(name = "tenant_id", nullable = false)
    private Tenant tenant;

    @Enumerated(EnumType.STRING)
    @Column(name = "plan", nullable = false)
    private PaymentPlan plan;

    @Column(name = "amount", nullable = false)
    private Double amount;

    @Column(name = "frequency")
    private Integer frequency;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private StandingOrderStatus status = StandingOrderStatus.PENDING;

    @Column(name = "external_ref")
    private String externalRef;

    @Column(name = "schedule_id")
    private String scheduleId;
}

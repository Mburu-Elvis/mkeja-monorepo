package co.ke.mkeja.onboarding.model.entity;

import co.ke.mkeja.onboarding.model.enums.LeaseStatus;
import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@EqualsAndHashCode(callSuper = true)
@Entity
@Table(name = "tbl_leases")
public class Lease extends BaseEntity {
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tenant_id", nullable = false)
    private Tenant tenant;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "unit_id", nullable = false)
    private PropertyUnit unit;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "invitation_id")
    private TenantInvitation invitation;

    @Column(name = "start_date", nullable = false)
    private LocalDate startDate;

    @Column(name = "end_date")
    private LocalDate endDate;

    @Column(name = "monthly_rent", nullable = false)
    private Double monthlyRent;

    @Column(name = "deposit_amount")
    private Double depositAmount;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private LeaseStatus status = LeaseStatus.PENDING_SIGNATURE;

    @Column(name = "signed_at")
    private LocalDateTime signedAt;
}

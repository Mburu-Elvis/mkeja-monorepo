package co.ke.mkeja.onboarding.model.entity;

import co.ke.mkeja.onboarding.model.enums.KycStatus;
import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
@EqualsAndHashCode(callSuper = true)
@Entity
@Table(name = "tbl_security_deposits")
public class SecurityDeposit extends BaseEntity {
    @ManyToOne
    @JoinColumn(name = "tenant_id", nullable = false)
    private Tenant tenant;

    @Column(name = "amount", nullable = false)
    private Double amount;

    @Column(name = "stk_ref")
    private String stkRef;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private KycStatus status = KycStatus.PENDING;
}

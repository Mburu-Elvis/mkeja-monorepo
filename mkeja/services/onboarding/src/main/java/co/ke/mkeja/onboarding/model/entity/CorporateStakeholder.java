package co.ke.mkeja.onboarding.model.entity;

import co.ke.mkeja.onboarding.model.enums.StakeholderType;
import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
@EqualsAndHashCode(callSuper = true)
@Entity
@Table(name = "tbl_corporate_stakeholders")
public class CorporateStakeholder extends BaseEntity {
    @ManyToOne
    @JoinColumn(name = "property_owner_id", nullable = false)
    private PropertyOwner propertyOwner;

    @Enumerated(EnumType.STRING)
    @Column(name = "stakeholder_type", nullable = false)
    private StakeholderType stakeholderType;

    @Column(name = "name", nullable = false)
    private String name;

    @Column(name = "national_id", length = 20)
    private String nationalId;

    @Column(name = "kra_pin", length = 20)
    private String kraPin;

    @Column(name = "ownership_pct")
    private String ownershipPct;
}

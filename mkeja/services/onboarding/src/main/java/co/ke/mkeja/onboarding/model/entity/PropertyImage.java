package co.ke.mkeja.onboarding.model.entity;

import co.ke.mkeja.onboarding.model.enums.UnitType;
import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
@EqualsAndHashCode(callSuper = true)
@Entity
@Table(name = "tbl_property_image")
public class PropertyImage extends BaseEntity {
    @ManyToOne(optional = false)
    @JoinColumn(name = "property_id", nullable = false)
    private Property property;

    @ManyToOne
    @JoinColumn(name = "unit_id")
    private PropertyUnit unit;

    @Enumerated(EnumType.STRING)
    @Column(name = "unit_type", length = 50)
    private UnitType unitType;

    @Column(name = "storage_key", nullable = false, length = 255)
    private String storageKey;

    @Column(name = "caption", length = 500)
    private String caption;

    @Column(name = "is_primary", nullable = false)
    private boolean primaryImage = false;

    @Column(name = "sort_order", nullable = false)
    private int sortOrder = 0;
}

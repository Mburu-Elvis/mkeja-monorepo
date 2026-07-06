package co.ke.mkeja.onboarding.model.entity;

import co.ke.mkeja.onboarding.model.enums.UnitAmenities;
import co.ke.mkeja.onboarding.model.enums.UnitStatus;
import co.ke.mkeja.onboarding.model.enums.UnitType;
import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.time.LocalDate;
import java.util.HashSet;
import java.util.Set;

@Data
@EqualsAndHashCode(callSuper = true)
@Entity
@Table(name = "tbl_property_unit")
public class PropertyUnit extends BaseEntity {
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "property_id", nullable = false)
    private Property property;

    @Column(name = "unit_number", nullable = false)
    private String unitNumber;

    @Column(name = "floor_number")
    private Integer floorNumber;

    @Column(name = "wing")
    private String wing;

    @Enumerated(EnumType.STRING)
    @Column(name = "unit_type")
    private UnitType unitType;

    @Column(name = "bedrooms")
    private Integer bedrooms;

    @Column(name = "bathrooms")
    private Integer bathrooms;

    @Column(name = "ensuite_bathrooms")
    private Integer ensuiteBathrooms;

    @ElementCollection
    @Enumerated(EnumType.STRING)
    @CollectionTable(name = "tbl_property_unit_amenities", joinColumns = @JoinColumn(name = "unit_id"))
    @Column(name = "amenity")
    private Set<UnitAmenities> amenities = new HashSet<>();

    @Column(name = "rent", nullable = false)
    private Double rent;

    @Column(name = "service_fee")
    private Double serviceFee;

    @Column(name = "deposit")
    private Double deposit;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private UnitStatus status = UnitStatus.VACANT;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tenant_id")
    private Tenant tenant;

    @Column(name = "discoverable", nullable = false)
    private boolean discoverable = false;

    @Column(name = "auto_recommend", nullable = false)
    private boolean autoRecommend = false;

    @Column(name = "listing_description", columnDefinition = "TEXT")
    private String listingDescription;

    @Column(name = "available_from")
    private LocalDate availableFrom;

    @Column(name = "promoted", nullable = false)
    private boolean promoted = false;
}

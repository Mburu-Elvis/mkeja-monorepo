package co.ke.mkeja.onboarding.model.entity;

import co.ke.mkeja.onboarding.model.enums.PropertyStatus;
import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.time.LocalDateTime;

@Data
@EqualsAndHashCode(callSuper = true)
@Entity
@Table(name = "tbl_properties")
public class Property extends BaseEntity {
    @ManyToOne
    @JoinColumn(name = "owner_id", nullable = false)
    private PropertyOwner owner;

    @ManyToOne
    @JoinColumn(name = "agent_id")
    private Agent agent;

    @Column(name = "name", nullable = false)
    private String name;

    @Column(name = "property_type")
    private String propertyType;

    @Column(name = "amenities", columnDefinition = "TEXT")
    private String amenities;

    @Enumerated(EnumType.STRING)
    @Column(name = "property_status", nullable = false)
    private PropertyStatus propertyStatus = PropertyStatus.PENDING_VERIFICATION;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "address", columnDefinition = "TEXT")
    private String address;

    @Column(name = "year_built")
    private Integer yearBuilt;

    @Column(name = "total_units", nullable = false)
    private Integer totalUnits = 1;

    @Column(name = "county")
    private String county;

    @Column(name = "city")
    private String city;

    @Column(name = "latitude")
    private Double latitude;

    @Column(name = "longitude")
    private Double longitude;

    @Column(name = "google_place_id")
    private String googlePlaceId;

    @Column(name = "rent_collection_day")
    private String rentCollectionDay;

    @Column(name = "grace_period")
    private Integer gracePeriodDays;

    @Column(name = "late_fee_amount")
    private Double lateFeeAmount;

    @Column(name = "late_fee_percentage")
    private Double lateFeePercentage;

    @ManyToOne
    @JoinColumn(name = "property_manager_id")
    private User propertyManager;

    @Column(name = "is_active", nullable = false)
    private boolean isActive = true;

    @Column(name = "is_verified", nullable = false)
    private boolean isVerified = false;

    @Column(name = "house_hunt_enabled", nullable = false)
    private boolean houseHuntEnabled = false;

    @Column(name = "auto_recommend_enabled", nullable = false)
    private boolean autoRecommendEnabled = false;

    @Column(name = "verified_at")
    private LocalDateTime verifiedAt;

    @ManyToOne
    @JoinColumn(name = "verified_by_id")
    private User verifiedBy;
}

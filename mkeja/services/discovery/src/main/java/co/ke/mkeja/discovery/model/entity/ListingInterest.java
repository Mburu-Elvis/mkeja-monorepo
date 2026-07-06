package co.ke.mkeja.discovery.model.entity;

import co.ke.mkeja.discovery.model.enums.InterestStatus;
import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
@EqualsAndHashCode(callSuper = true)
@Entity
@Table(name = "tbl_listing_interest", indexes = {
        @Index(name = "idx_listing_interest_landlord", columnList = "landlord_user_id"),
        @Index(name = "idx_listing_interest_tenant", columnList = "tenant_user_id"),
        @Index(name = "idx_listing_interest_unit", columnList = "unit_id")
})
public class ListingInterest extends BaseEntity {

    @Column(name = "tenant_user_id")
    private Long tenantUserId;

    @Column(name = "tenant_id")
    private Long tenantId;

    @Column(name = "tenant_name", nullable = false)
    private String tenantName;

    @Column(name = "tenant_phone", nullable = false, length = 12)
    private String tenantPhone;

    @Column(name = "unit_id", nullable = false)
    private Long unitId;

    @Column(name = "property_id", nullable = false)
    private Long propertyId;

    @Column(name = "landlord_user_id", nullable = false)
    private Long landlordUserId;

    @Column(name = "unit_label")
    private String unitLabel;

    @Column(name = "property_name")
    private String propertyName;

    @Column(name = "monthly_rent")
    private Double monthlyRent;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private InterestStatus status = InterestStatus.NEW;

    @Column(name = "message", columnDefinition = "TEXT")
    private String message;
}

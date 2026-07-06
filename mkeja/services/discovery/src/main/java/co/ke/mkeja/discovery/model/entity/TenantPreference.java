package co.ke.mkeja.discovery.model.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.time.LocalDate;

@Data
@EqualsAndHashCode(callSuper = true)
@Entity
@Table(name = "tbl_tenant_preference")
public class TenantPreference extends BaseEntity {

    @Column(name = "tenant_user_id", nullable = false, unique = true)
    private Long tenantUserId;

    @Column(name = "min_rent")
    private Double minRent;

    @Column(name = "max_rent")
    private Double maxRent;

    @Column(name = "preferred_county")
    private String preferredCounty;

    @Column(name = "preferred_city")
    private String preferredCity;

    @Column(name = "min_bedrooms")
    private Integer minBedrooms;

    @Column(name = "move_by_date")
    private LocalDate moveByDate;
}

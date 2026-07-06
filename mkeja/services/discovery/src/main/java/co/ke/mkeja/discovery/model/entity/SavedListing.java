package co.ke.mkeja.discovery.model.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
@EqualsAndHashCode(callSuper = true)
@Entity
@Table(name = "tbl_saved_listing", uniqueConstraints = {
        @UniqueConstraint(name = "uk_saved_listing_tenant_unit", columnNames = {"tenant_user_id", "unit_id"})
})
public class SavedListing extends BaseEntity {

    @Column(name = "tenant_user_id", nullable = false)
    private Long tenantUserId;

    @Column(name = "unit_id", nullable = false)
    private Long unitId;
}

package co.ke.mkeja.onboarding.model.entity;

import co.ke.mkeja.onboarding.model.enums.Gender;
import co.ke.mkeja.onboarding.model.enums.IdType;
import co.ke.mkeja.onboarding.model.enums.KycStatus;
import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.time.LocalDateTime;

@Data
@EqualsAndHashCode(callSuper = true)
@Entity
@Table(name = "tbl_tenants")
public class Tenant extends BaseEntity {
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(name = "gender")
    private Gender gender;

    @Column(name = "national_id", length = 20)
    private String nationalId;

    @Enumerated(EnumType.STRING)
    @Column(name = "id_type")
    private IdType idType;

    @Column(name = "id_verified", nullable = false)
    private boolean idVerified = false;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "property_id")
    private Property property;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "unit_id")
    private PropertyUnit unit;

    @Enumerated(EnumType.STRING)
    @Column(name = "kyc_status", nullable = false)
    private KycStatus kycStatus = KycStatus.PENDING;

    @Column(name = "kyc_verified_at")
    private LocalDateTime kycVerifiedAt;

    @Column(name = "wallet_id")
    private String walletId;

    @Column(name = "is_active", nullable = false)
    private boolean isActive = true;
}

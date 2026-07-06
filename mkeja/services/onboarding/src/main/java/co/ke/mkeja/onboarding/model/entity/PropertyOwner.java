package co.ke.mkeja.onboarding.model.entity;

import co.ke.mkeja.onboarding.model.enums.OwnerSubtype;
import co.ke.mkeja.onboarding.model.enums.OwnerType;
import co.ke.mkeja.onboarding.model.enums.KycStatus;
import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.time.LocalDateTime;

@Data
@EqualsAndHashCode(callSuper = true)
@Entity
@Table(name = "tbl_property_owner")
public class PropertyOwner extends BaseEntity {
    @OneToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(name = "owner_type", nullable = false)
    private OwnerType ownerType;

    @Enumerated(EnumType.STRING)
    @Column(name = "owner_subtype", nullable = false)
    private OwnerSubtype ownerSubtype;

    @Column(name = "national_id", length = 20)
    private String nationalId;

    @Column(name = "id_verified", nullable = false)
    private boolean idVerified = false;

    @Column(name = "id_verification_date")
    private LocalDateTime idVerificationDate;

    @Column(name = "company_name")
    private String companyName;

    @Column(name = "company_registration_number")
    private String companyRegistrationNumber;

    @Column(name = "kra_pin", length = 20)
    private String kraPin;

    @Enumerated(EnumType.STRING)
    @Column(name = "kyc_status", nullable = false)
    private KycStatus kycStatus = KycStatus.PENDING;
}

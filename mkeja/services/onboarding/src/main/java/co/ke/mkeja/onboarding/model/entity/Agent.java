package co.ke.mkeja.onboarding.model.entity;

import co.ke.mkeja.onboarding.model.enums.AgentType;
import co.ke.mkeja.onboarding.model.enums.KycStatus;
import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.time.LocalDateTime;

@Data
@EqualsAndHashCode(callSuper = true)
@Entity
@Table(name = "tbl_agents")
public class Agent extends BaseEntity {
    @OneToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(name = "agent_type", nullable = false)
    private AgentType agentType;

    @Column(name = "national_id", length = 12)
    private String nationalId;

    @Column(name = "license_number")
    private String licenseNumber;

    @Column(name = "license_expiry")
    private LocalDateTime licenseExpiry;

    @Column(name = "company_name")
    private String companyName;

    @Column(name = "registration_number")
    private String registrationNumber;

    @Column(name = "kra_pin")
    private String kraPin;

    @Column(name = "physical_address")
    private String physicalAddress;

    @Column(name = "city")
    private String city;

    @Column(name = "county")
    private String county;

    @Column(name = "website")
    private String website;

    @Enumerated(EnumType.STRING)
    @Column(name = "kyc_status", nullable = false)
    private KycStatus kycStatus = KycStatus.PENDING;
}

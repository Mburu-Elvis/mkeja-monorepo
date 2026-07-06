package co.ke.mkeja.onboarding.dto.response;

import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.experimental.SuperBuilder;

import java.time.LocalDateTime;
import java.util.List;

@Data
@SuperBuilder
@EqualsAndHashCode(callSuper = false)
public class UserProfileResponse {
    private String id;
    private String fullName;
    private String firstName;
    private String lastName;
    private String phone;
    private String email;
    private String role;
    private String status;
    private String kycStatus;
    private LocalDateTime kycVerifiedAt;
    private LocalDateTime joinedDate;
    private LocalDateTime lastLoginAt;
    private Boolean otpVerified;
    private String lockReason;

    private String idType;
    private String idNumber;
    private Boolean idVerified;
    private String gender;

    private String entityType;
    private String ownerSubtype;
    private String agentType;
    private String companyName;
    private String companyRegistrationNumber;
    private String registrationNumber;
    private String kraPin;
    private String licenseNumber;
    private LocalDateTime licenseExpiry;
    private String physicalAddress;
    private String city;
    private String county;
    private String website;

    private Integer propertyCount;
    private Integer unitCount;
    private Integer tenantCount;
    private Integer tenancyCount;
    private Integer activeTenancyCount;

    private List<UserKycDocumentResponse> kycDocuments;
}

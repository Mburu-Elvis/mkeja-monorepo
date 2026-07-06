package co.ke.mkeja.onboarding.mapper;

import co.ke.mkeja.onboarding.dto.response.KycApplicationResponse;
import co.ke.mkeja.onboarding.dto.response.UserResponse;
import co.ke.mkeja.onboarding.model.entity.Agent;
import co.ke.mkeja.onboarding.model.entity.PropertyOwner;
import co.ke.mkeja.onboarding.model.entity.Tenant;
import co.ke.mkeja.onboarding.model.entity.User;
import co.ke.mkeja.onboarding.model.enums.KycStatus;
import co.ke.mkeja.onboarding.model.enums.UserType;

public final class EntityMapper {

    private EntityMapper() {}

    public static String toFrontendKycStatus(KycStatus status) {
        if (status == null) {
            return "PENDING";
        }
        return switch (status) {
            case VERIFIED, APPROVED -> "APPROVED";
            case REJECTED -> "REJECTED";
            case MANUAL_REVIEW -> "MANUAL_REVIEW";
            case PENDING -> "PENDING";
        };
    }

    public static String toFrontendRole(UserType userType) {
        if (userType == null) {
            return "TENANT";
        }
        return switch (userType) {
            case PROPERTY_OWNER -> "LANDLORD";
            case ADMIN -> "ADMIN";
            case AGENT -> "AGENT";
            case TENANT -> "TENANT";
        };
    }

    public static UserResponse toUserResponse(User user, KycStatus kycStatus) {
        return UserResponse.builder()
                .id(String.valueOf(user.getId()))
                .fullName(user.getFullName())
                .phone(user.getPhone())
                .email(user.getEmail())
                .role(toFrontendRole(user.getUserType()))
                .kycStatus(toFrontendKycStatus(kycStatus))
                .createdAt(user.getCreatedAt())
                .build();
    }

    public static KycApplicationResponse toKycApplication(Tenant tenant) {
        return KycApplicationResponse.builder()
                .id(String.valueOf(tenant.getId()))
                .fullName(tenant.getUser().getFullName())
                .idNumber(tenant.getNationalId())
                .idType(tenant.getIdType() != null ? tenant.getIdType().name() : "NATIONAL_ID")
                .landlordName(tenant.getProperty() != null && tenant.getProperty().getOwner() != null
                        ? tenant.getProperty().getOwner().getUser().getFullName() : "")
                .unitRef(tenant.getUnit() != null ? tenant.getUnit().getUnitNumber() : "")
                .submittedAt(tenant.getCreatedAt())
                .status(toFrontendKycStatus(tenant.getKycStatus()).toLowerCase())
                .applicantType("TENANT")
                .build();
    }

    public static KycApplicationResponse toKycApplication(PropertyOwner owner) {
        return KycApplicationResponse.builder()
                .id(String.valueOf(owner.getId()))
                .fullName(owner.getUser().getFullName())
                .idNumber(owner.getNationalId())
                .idType("NATIONAL_ID")
                .landlordName(owner.getUser().getFullName())
                .unitRef("")
                .submittedAt(owner.getCreatedAt())
                .status(toFrontendKycStatus(owner.getKycStatus()).toLowerCase())
                .applicantType("LANDLORD")
                .build();
    }

    public static KycApplicationResponse toKycApplication(Agent agent) {
        return KycApplicationResponse.builder()
                .id(String.valueOf(agent.getId()))
                .fullName(agent.getUser().getFullName())
                .idNumber(agent.getNationalId())
                .idType("NATIONAL_ID")
                .landlordName("")
                .unitRef("")
                .submittedAt(agent.getCreatedAt())
                .status(toFrontendKycStatus(agent.getKycStatus()).toLowerCase())
                .applicantType("AGENT")
                .build();
    }
}

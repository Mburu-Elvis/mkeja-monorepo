package co.ke.mkeja.onboarding.model.enums;

public enum RoleName {
    TENANT(UserType.TENANT),
    PROPERTY_OWNER(UserType.PROPERTY_OWNER),
    AGENT(UserType.AGENT),
    ADMIN(UserType.ADMIN),
    SUPER_ADMIN(UserType.ADMIN);

    private final UserType userType;

    RoleName(UserType userType) {
        this.userType = userType;
    }

    public UserType getUserType() {
        return userType;
    }

    public static RoleName fromUserType(UserType userType) {
        return switch (userType) {
            case TENANT -> TENANT;
            case PROPERTY_OWNER -> PROPERTY_OWNER;
            case AGENT -> AGENT;
            case ADMIN -> ADMIN;
        };
    }

    public boolean isAdminRole() {
        return this == ADMIN || this == SUPER_ADMIN;
    }

    public static RoleName fromRegistrationRole(String role) {
        if ("LANDLORD".equalsIgnoreCase(role)) {
            return PROPERTY_OWNER;
        }
        if ("ADMIN".equalsIgnoreCase(role)) {
            return ADMIN;
        }
        return TENANT;
    }
}

package co.ke.mkeja.onboarding.dto.response;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class AdminBusinessMetrics {
    private long totalProperties;
    private long verifiedProperties;
    private long pendingProperties;
    private long totalUnits;
    private long occupiedUnits;
    private long vacantUnits;
    private long pendingInvitations;
    private long newUsersLast30Days;
    private long newLandlordsLast30Days;
    private long newTenantsLast30Days;
    private long newPropertiesLast30Days;
    private double occupancyRate;
}

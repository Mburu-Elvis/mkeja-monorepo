package co.ke.mkeja.onboarding.dto.response;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class AdminFinancialMetrics {
    private double monthlyRentRoll;
    private double totalSecurityDeposits;
    private long securityDepositsPending;
    private long securityDepositsApproved;
    private long activeStandingOrders;
    private long pendingStandingOrders;
    private double standingOrderVolume;
    private double estimatedMonthlyVolume;
}

package co.ke.mkeja.onboarding.dto.response;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class AdminOperationalMetrics {
    private long suspendedUsers;
    private long lockedUsers;
    private long pendingTenancies;
    private long failedStandingOrders;
    private long totalInvitations;
}

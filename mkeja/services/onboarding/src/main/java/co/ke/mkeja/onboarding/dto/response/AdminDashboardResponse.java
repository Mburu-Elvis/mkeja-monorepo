package co.ke.mkeja.onboarding.dto.response;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class AdminDashboardResponse {
    private long totalUsers;
    private long totalLandlords;
    private long totalTenants;
    private long kycPending;
    private long kycManualReview;
    private long kycRejected;
    private long propertiesPendingVerification;
    private long activeTenancies;
    private String apiStatus;
    private List<KycApplicationResponse> recentKycApplications;
    private List<PropertyResponse> pendingProperties;
    private AdminFinancialMetrics financial;
    private AdminBusinessMetrics business;
    private AdminOperationalMetrics operational;
    private List<AdminGrowthDataPoint> growth;
}

package co.ke.mkeja.onboarding.dto.response;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class AdminMonthlyReportResponse {
    private int year;
    private int month;
    private String monthLabel;
    private long newUsers;
    private long newTenants;
    private long newLandlords;
    private long newProperties;
    private long newTenancies;
    private long securityDeposits;
    private double securityDepositAmount;
    private long standingOrders;
    private double standingOrderAmount;
    private double rentRollEndOfMonth;
    private long activeTenancies;
    private long activeLandlords;
    private long activeTenants;
    private List<AdminGrowthDataPoint> dailyBreakdown;
    private String dataSource;
}

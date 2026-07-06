package co.ke.mkeja.onboarding.dto.response;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class AdminDailyReportResponse {
    private String date;
    private long newUsers;
    private long newTenants;
    private long newLandlords;
    private long newProperties;
    private long newTenancies;
    private long securityDeposits;
    private double securityDepositAmount;
    private long standingOrders;
    private double standingOrderAmount;
    private double rentRollActive;
    private long ledgerEntries;
    private double ledgerVolume;
    private String dataSource;
}

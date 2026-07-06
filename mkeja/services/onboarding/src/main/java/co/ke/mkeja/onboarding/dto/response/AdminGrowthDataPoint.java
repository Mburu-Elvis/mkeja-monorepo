package co.ke.mkeja.onboarding.dto.response;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class AdminGrowthDataPoint {
    private String period;
    private String shortLabel;
    private long users;
    private long landlords;
    private long tenants;
    private long properties;
    private double rentRoll;
}

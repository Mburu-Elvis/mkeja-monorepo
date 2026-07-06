package co.ke.mkeja.onboarding.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDate;

@Data
@Builder
public class LeaseSummaryResponse {
    private String landlordName;
    private String unitName;
    private String propertyAddress;
    private Double monthlyRent;
    private Double depositAmount;
    private LocalDate leaseStartDate;
    private LocalDate leaseEndDate;
}

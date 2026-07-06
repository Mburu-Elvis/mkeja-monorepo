package co.ke.mkeja.onboarding.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDate;

@Data
@Builder
public class AdminTenancySummaryResponse {
    private Long id;
    private Long propertyId;
    private Long unitId;
    private String tenantUserId;
    private String tenantName;
    private String propertyName;
    private String unitNumber;
    private String status;
    private Double monthlyRent;
    private LocalDate moveInDate;
    private LocalDate leaseEndDate;
}

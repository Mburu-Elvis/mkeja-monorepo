package co.ke.mkeja.onboarding.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDate;

@Data
@Builder
public class AdminTenancyDetailResponse {
    private Long id;
    private Long tenantId;
    private String tenantUserId;
    private String tenantName;
    private String tenantPhone;
    private Long unitId;
    private String unitNumber;
    private Long propertyId;
    private String propertyName;
    private String landlordName;
    private String status;
    private Double monthlyRent;
    private LocalDate moveInDate;
    private LocalDate moveOutDate;
    private LocalDate leaseStartDate;
    private LocalDate leaseEndDate;
    private Long leaseId;
}

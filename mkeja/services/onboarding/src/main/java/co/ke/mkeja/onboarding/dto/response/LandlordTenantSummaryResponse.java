package co.ke.mkeja.onboarding.dto.response;

import co.ke.mkeja.onboarding.model.enums.KycStatus;
import co.ke.mkeja.onboarding.model.enums.TenancyStatus;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDate;

@Data
@Builder
public class LandlordTenantSummaryResponse {
    private Long tenancyId;
    private Long tenantId;
    private String tenantName;
    private String tenantPhone;
    private KycStatus kycStatus;
    private TenancyStatus tenancyStatus;
    private Long propertyId;
    private String propertyName;
    private String unitNumber;
    private Long unitId;
    private Integer floorNumber;
    private String wing;
    private Double monthlyRent;
    private Integer rentDueDay;
    private LocalDate leaseStartDate;
    private LocalDate leaseEndDate;
    private String source;
}

package co.ke.mkeja.onboarding.dto.response;

import co.ke.mkeja.onboarding.model.enums.TenancyStatus;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDate;

@Data
@Builder
public class TenancyHistoryItemResponse {
    private Long tenancyId;
    private Long tenantId;
    private String tenantName;
    private String tenantPhone;
    private TenancyStatus status;
    private LocalDate leaseStartDate;
    private LocalDate leaseEndDate;
    private LocalDate moveInDate;
    private LocalDate moveOutDate;
    private Double monthlyRent;
    private Integer rentDueDay;
}

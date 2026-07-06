package co.ke.mkeja.onboarding.dto.response;

import co.ke.mkeja.onboarding.model.enums.TenancyStatus;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDate;
import java.util.List;

@Data
@Builder
public class TenantTenancyHistoryResponse {
    private List<TenantTenancyItem> tenancies;

    @Data
    @Builder
    public static class TenantTenancyItem {
        private Long tenancyId;
        private String propertyName;
        private String propertyAddress;
        private String unitNumber;
        private Integer floorNumber;
        private String wing;
        private TenancyStatus status;
        private LocalDate leaseStartDate;
        private LocalDate leaseEndDate;
        private LocalDate moveInDate;
        private LocalDate moveOutDate;
        private Double monthlyRent;
        private Integer rentDueDay;
        private String landlordName;
    }
}

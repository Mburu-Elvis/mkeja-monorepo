package co.ke.mkeja.onboarding.dto.response;

import co.ke.mkeja.onboarding.model.enums.TenancyStatus;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class SupportTenancyOption {
    private Long tenancyId;
    private Long unitId;
    private Long propertyId;
    private String label;
    private String tenantName;
    private TenancyStatus status;
}

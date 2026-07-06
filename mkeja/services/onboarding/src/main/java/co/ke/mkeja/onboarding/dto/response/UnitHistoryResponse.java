package co.ke.mkeja.onboarding.dto.response;

import co.ke.mkeja.onboarding.model.enums.UnitStatus;
import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class UnitHistoryResponse {
    private Long unitId;
    private Long propertyId;
    private String propertyName;
    private String unitNumber;
    private Integer floorNumber;
    private String wing;
    private Double rent;
    private UnitStatus status;
    private List<TenancyHistoryItemResponse> tenancies;
}

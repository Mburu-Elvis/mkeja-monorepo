package co.ke.mkeja.onboarding.dto.request;

import co.ke.mkeja.onboarding.model.enums.UnitStatus;
import co.ke.mkeja.onboarding.model.enums.UnitType;
import lombok.Data;

@Data
public class UpdateUnitRequest {
    private UnitType unitType;
    private Double rent;
    private Double deposit;
    private Integer floorNumber;
    private String wing;
    private UnitStatus status;
}

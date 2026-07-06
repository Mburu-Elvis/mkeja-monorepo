package co.ke.mkeja.onboarding.dto.request;

import co.ke.mkeja.onboarding.model.enums.UnitType;
import lombok.Data;

@Data
public class CreateUnitRequest {
    private String unitNumber;
    private Integer floorNumber;
    private String wing;
    private UnitType unitType;
    private Integer bedrooms;
    private Integer bathrooms;
    private Double sizeSqm;
    private Double rent;
    private Double deposit;
    private Double serviceFee;
}

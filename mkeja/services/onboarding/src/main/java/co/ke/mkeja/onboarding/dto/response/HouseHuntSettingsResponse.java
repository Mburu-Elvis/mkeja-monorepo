package co.ke.mkeja.onboarding.dto.response;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class HouseHuntSettingsResponse {
    private Long propertyId;
    private String propertyName;
    private boolean verified;
    private boolean houseHuntEnabled;
    private boolean autoRecommendEnabled;
    private int vacantUnits;
    private int listedUnits;
    private int autoRecommendUnits;
    private List<UnitListingSummary> units;
}

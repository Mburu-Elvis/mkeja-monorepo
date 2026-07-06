package co.ke.mkeja.onboarding.dto.response;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class AdminPropertyDetailResponse {
    private PropertyResponse property;
    private String landlordName;
    private String landlordUserId;
    private List<UnitResponse> units;
}

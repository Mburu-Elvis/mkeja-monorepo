package co.ke.mkeja.onboarding.dto.response;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class AdminPropertySummaryResponse {
    private Long id;
    private String name;
    private String address;
    private String city;
    private String status;
    private Integer totalUnits;
    private Integer occupiedUnits;
}

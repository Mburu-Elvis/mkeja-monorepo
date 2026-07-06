package co.ke.mkeja.onboarding.dto.response;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class PropertyImageResponse {
    private Long id;
    private Long propertyId;
    private Long unitId;
    private String unitType;
    private String url;
    private String caption;
    private boolean primary;
    private int sortOrder;
}

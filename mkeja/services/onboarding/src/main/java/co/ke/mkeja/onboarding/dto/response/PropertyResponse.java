package co.ke.mkeja.onboarding.dto.response;

import co.ke.mkeja.onboarding.model.enums.PropertyStatus;
import co.ke.mkeja.onboarding.model.enums.UnitStatus;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class PropertyResponse {
    private Long id;
    private String name;
    private String propertyType;
    private String description;
    private String address;
    private String city;
    private String county;
    private String amenities;
    private Integer totalUnits;
    private PropertyStatus propertyStatus;
    private boolean verified;
    private boolean houseHuntEnabled;
    private boolean autoRecommendEnabled;
    private String coverImageUrl;
    private int vacantUnits;
    private int occupiedUnits;
    private Integer rentDueDay;
    private Integer gracePeriodDays;
    private int pendingInvites;
    private double monthlyRentRoll;
    private String nextRentDueLabel;
}

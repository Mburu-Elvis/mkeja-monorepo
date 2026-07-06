package co.ke.mkeja.onboarding.dto.request;

import lombok.Data;

@Data
public class CreatePropertyRequest {
    private String name;
    private String propertyType;
    private String description;
    private String address;
    private String city;
    private String county;
    private String amenities;
    private Integer yearBuilt;
    private Integer totalUnits;
}

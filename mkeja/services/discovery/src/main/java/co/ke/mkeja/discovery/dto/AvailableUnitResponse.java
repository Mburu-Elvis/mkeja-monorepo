package co.ke.mkeja.discovery.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDate;

@Data
@Builder
public class AvailableUnitResponse {
    private Long unitId;
    private String unitNumber;
    private Integer floorNumber;
    private String wing;
    private String unitType;
    private String unitTypeLabel;
    private Integer bedrooms;
    private Integer bathrooms;
    private Double rent;
    private Double deposit;
    private String listingDescription;
    private LocalDate availableFrom;
    private boolean promoted;
    private boolean saved;
    private String sampleImageUrl;
}

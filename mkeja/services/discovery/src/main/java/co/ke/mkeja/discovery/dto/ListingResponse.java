package co.ke.mkeja.discovery.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDate;
import java.util.List;

@Data
@Builder
public class ListingResponse {
    private Long unitId;
    private Long propertyId;
    private String propertyName;
    private String unitNumber;
    private String address;
    private String city;
    private String county;
    private Double rent;
    private Double deposit;
    private Integer bedrooms;
    private Integer bathrooms;
    private String unitType;
    private String listingDescription;
    private LocalDate availableFrom;
    private String landlordName;
    private boolean verifiedProperty;
    private boolean verifiedLandlord;
    private boolean autoRecommend;
    private boolean promoted;
    private boolean saved;
    private String coverImageUrl;
    private List<String> imageUrls;
    private List<String> matchReasons;
    private Double matchScore;
}

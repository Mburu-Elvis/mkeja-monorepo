package co.ke.mkeja.discovery.dto;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class PropertyListingResponse {
    private Long propertyId;
    private String propertyName;
    private String description;
    private String address;
    private String city;
    private String county;
    private String coverImageUrl;
    private List<String> imageUrls;
    private int availableUnits;
    private Double minRent;
    private Double maxRent;
    private List<UnitTypeBreakdown> unitTypes;
    private boolean verifiedProperty;
    private boolean verifiedLandlord;
    private boolean promoted;
    private boolean saved;
    private List<String> matchReasons;
    private Double matchScore;
}

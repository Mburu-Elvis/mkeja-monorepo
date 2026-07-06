package co.ke.mkeja.discovery.dto;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class PropertyListingDetailResponse {
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
    private List<AvailableUnitResponse> units;
    private boolean verifiedProperty;
    private boolean verifiedLandlord;
    private boolean promoted;
    private String landlordName;
}

package co.ke.mkeja.discovery.dto;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class UnitTypeBreakdown {
    private String unitType;
    private String label;
    private int availableCount;
    private Double minRent;
    private Double maxRent;
    private String sampleImageUrl;
    private List<String> imageUrls;
}

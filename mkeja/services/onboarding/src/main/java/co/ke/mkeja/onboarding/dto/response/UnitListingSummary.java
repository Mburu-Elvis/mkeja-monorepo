package co.ke.mkeja.onboarding.dto.response;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class UnitListingSummary {
    private Long unitId;
    private String unitNumber;
    private String status;
    private boolean discoverable;
    private boolean autoRecommend;
    private boolean promoted;
    private String listingDescription;
    private Double rent;
    private String coverImageUrl;
    private List<String> imageUrls;
}

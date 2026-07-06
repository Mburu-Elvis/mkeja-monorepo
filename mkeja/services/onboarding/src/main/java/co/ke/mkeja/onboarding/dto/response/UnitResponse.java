package co.ke.mkeja.onboarding.dto.response;

import co.ke.mkeja.onboarding.model.enums.UnitStatus;
import co.ke.mkeja.onboarding.model.enums.UnitType;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class UnitResponse {
    private Long id;
    private Long propertyId;
    private String propertyName;
    private String unitNumber;
    private Integer floorNumber;
    private String wing;
    private UnitType unitType;
    private Integer bedrooms;
    private Integer bathrooms;
    private Double rent;
    private Double deposit;
    private UnitStatus status;
    private String qrCodeUrl;
    private Integer rentDueDay;
    private String tenantName;
    private String tenantPhone;
    private String tenancyStatus;
    private boolean pendingInvite;
    private String pendingInviteCode;
    private boolean discoverable;
    private boolean autoRecommend;
    private boolean promoted;
    private String listingDescription;
    private java.time.LocalDate availableFrom;
}

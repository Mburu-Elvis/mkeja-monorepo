package co.ke.mkeja.onboarding.dto.response;

import co.ke.mkeja.onboarding.model.enums.InvitationStatus;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
public class LandlordInvitationSummaryResponse {
    private String code;
    private InvitationStatus status;
    private String tenantName;
    private String tenantPhone;
    private String propertyName;
    private Long propertyId;
    private String unitNumber;
    private Long unitId;
    private Integer floorNumber;
    private String wing;
    private Double monthlyRent;
    private Integer rentDueDay;
    private LocalDate leaseStartDate;
    private LocalDateTime expiresAt;
    private boolean existingTenant;
}

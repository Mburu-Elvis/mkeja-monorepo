package co.ke.mkeja.onboarding.dto.response;

import co.ke.mkeja.onboarding.model.enums.InvitationStatus;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
public class TenantInvitationSummaryResponse {
    private String code;
    private InvitationStatus status;
    private String landlordName;
    private String propertyName;
    private String unitNumber;
    private Long unitId;
    private Long propertyId;
    private Double monthlyRent;
    private LocalDate leaseStartDate;
    private LocalDateTime expiresAt;
    private String invitationUrl;
}

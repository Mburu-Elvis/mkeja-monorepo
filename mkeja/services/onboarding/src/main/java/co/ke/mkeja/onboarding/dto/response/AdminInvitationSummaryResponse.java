package co.ke.mkeja.onboarding.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
public class AdminInvitationSummaryResponse {
    private Long id;
    private String code;
    private String status;
    private String tenantName;
    private String tenantPhone;
    private String landlordName;
    private String landlordUserId;
    private String propertyName;
    private Long propertyId;
    private String unitNumber;
    private Long unitId;
    private Double monthlyRent;
    private LocalDate leaseStartDate;
    private LocalDateTime expiresAt;
    private LocalDateTime createdAt;
}

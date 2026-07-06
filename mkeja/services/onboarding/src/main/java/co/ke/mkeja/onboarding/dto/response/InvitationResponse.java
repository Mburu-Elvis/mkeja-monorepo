package co.ke.mkeja.onboarding.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDate;

@Data
@Builder
public class InvitationResponse {
    private String code;
    private String landlordName;
    private String unitName;
    private Double monthlyRent;
    private Double depositAmount;
    private LocalDate leaseStartDate;
    private LocalDate leaseEndDate;
    private String address;
    private String invitationUrl;
    private String qrCodeUrl;
    private String message;
    private Integer rentDueDay;
    private Boolean existingTenant;
    private String tenantKycStatus;
    private Boolean tenancyCreated;
    private Long tenancyId;
    private String flowType;
}

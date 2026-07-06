package co.ke.mkeja.onboarding.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDate;

@Data
public class CreateInvitationRequest {
    @NotBlank
    private String fullName;

    @NotBlank
    private String phone;

    private String email;

    @NotNull
    private Long unitId;

    @NotNull
    private Double monthlyRent;

    private Double depositAmount;

    private String paymentPlan = "MONTHLY";

    /** Day of month (1-28) when rent is due — set by landlord, not payment frequency */
    private Integer rentDueDay = 1;

    @NotNull
    private LocalDate leaseStartDate;

    private LocalDate leaseEndDate;
}

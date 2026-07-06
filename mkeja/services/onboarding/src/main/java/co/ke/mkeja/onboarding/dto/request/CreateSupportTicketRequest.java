package co.ke.mkeja.onboarding.dto.request;

import co.ke.mkeja.onboarding.model.enums.SupportTicketPriority;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class CreateSupportTicketRequest {

    @NotBlank
    @Size(min = 5, max = 100)
    private String subject;

    @NotBlank
    @Size(max = 40)
    private String category;

    @NotNull
    private SupportTicketPriority priority;

    @NotBlank
    @Size(min = 20, max = 2000)
    private String description;

    private Long tenancyId;
    private Long unitId;
    private Long propertyId;
}

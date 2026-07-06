package co.ke.mkeja.onboarding.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class SupportRoutingPreviewRequest {
    @NotBlank
    @Size(max = 40)
    private String category;

    private Long tenancyId;
    private Long propertyId;
}

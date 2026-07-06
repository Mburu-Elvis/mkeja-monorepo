package co.ke.mkeja.onboarding.dto.response;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class SupportPropertyOption {
    private Long propertyId;
    private String label;
    private String ownerName;
    private String agentName;
    private boolean hasAgent;
}

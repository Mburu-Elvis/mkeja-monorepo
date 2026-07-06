package co.ke.mkeja.onboarding.dto.response;

import co.ke.mkeja.onboarding.model.enums.SupportRoutingTarget;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class SupportRoutingPreviewResponse {
    private SupportRoutingTarget routingTarget;
    private String routingTargetLabel;
    private String routingReason;
    private String contextLabel;
    private String assigneeName;
    private boolean requiresTenancy;
    private boolean requiresProperty;
}

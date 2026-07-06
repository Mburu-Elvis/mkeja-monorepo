package co.ke.mkeja.onboarding.service.support;

import co.ke.mkeja.onboarding.model.entity.Agent;
import co.ke.mkeja.onboarding.model.entity.Property;
import co.ke.mkeja.onboarding.model.entity.Tenancy;
import co.ke.mkeja.onboarding.model.entity.User;
import co.ke.mkeja.onboarding.model.enums.SupportRoutingTarget;
import co.ke.mkeja.onboarding.model.enums.UserType;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class SupportRoutingDecision {
    private SupportRoutingTarget routingTarget;
    private User assignedUser;
    private String routingReason;
    private String contextLabel;
    private Long tenancyId;
    private Long unitId;
    private Long propertyId;
    private String acknowledgementMessage;
}

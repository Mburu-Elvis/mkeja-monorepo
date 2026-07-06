package co.ke.mkeja.onboarding.dto.response;

import co.ke.mkeja.onboarding.model.enums.SupportRoutingTarget;
import co.ke.mkeja.onboarding.model.enums.SupportTicketPriority;
import co.ke.mkeja.onboarding.model.enums.SupportTicketStatus;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
public class SupportTicketResponse {
    private Long id;
    private String referenceCode;
    private String subject;
    private String category;
    private SupportTicketPriority priority;
    private SupportTicketStatus status;
    private String description;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private List<SupportTicketMessageResponse> messages;
    private SupportRoutingTarget routingTarget;
    private String routingReason;
    private String contextLabel;
    private Long tenancyId;
    private Long unitId;
    private Long propertyId;
    private String requesterName;
    private String assigneeName;
    private boolean inboxTicket;
    private boolean platformTicket;
}

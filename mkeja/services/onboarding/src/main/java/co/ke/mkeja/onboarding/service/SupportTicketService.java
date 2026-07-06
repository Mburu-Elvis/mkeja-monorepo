package co.ke.mkeja.onboarding.service;

import co.ke.mkeja.onboarding.dto.request.CreateSupportTicketRequest;
import co.ke.mkeja.onboarding.dto.request.ReplySupportTicketRequest;
import co.ke.mkeja.onboarding.dto.request.SupportRoutingPreviewRequest;
import co.ke.mkeja.onboarding.dto.response.SupportRoutingPreviewResponse;
import co.ke.mkeja.onboarding.dto.response.SupportTicketListResponse;
import co.ke.mkeja.onboarding.dto.response.SupportTicketMessageResponse;
import co.ke.mkeja.onboarding.dto.response.SupportTicketResponse;
import co.ke.mkeja.onboarding.exception.BadRequestException;
import co.ke.mkeja.onboarding.exception.ResourceNotFoundException;
import co.ke.mkeja.onboarding.model.entity.SupportTicket;
import co.ke.mkeja.onboarding.model.entity.SupportTicketMessage;
import co.ke.mkeja.onboarding.model.entity.User;
import co.ke.mkeja.onboarding.model.enums.SupportRoutingTarget;
import co.ke.mkeja.onboarding.model.enums.SupportTicketStatus;
import co.ke.mkeja.onboarding.repository.SupportTicketRepository;
import co.ke.mkeja.onboarding.service.support.SupportRoutingDecision;
import co.ke.mkeja.onboarding.service.support.SupportTicketRouter;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Set;
import java.util.concurrent.ThreadLocalRandom;

@Service
@RequiredArgsConstructor
public class SupportTicketService {

    private static final String PLATFORM_TEAM_NAME = "Mkeja Platform";

    private final SupportTicketRepository supportTicketRepository;
    private final SupportTicketRouter supportTicketRouter;
    private final RoleService roleService;

    @Transactional(readOnly = true)
    public SupportTicketListResponse listTickets(User user) {
        return listSubmittedTickets(user);
    }

    @Transactional(readOnly = true)
    public SupportTicketListResponse listSubmittedTickets(User user) {
        return SupportTicketListResponse.builder()
                .tickets(supportTicketRepository.findByUserIdWithMessages(user.getId()).stream()
                        .map(ticket -> toResponse(ticket, user, false))
                        .toList())
                .build();
    }

    @Transactional(readOnly = true)
    public SupportTicketListResponse listInboxTickets(User user) {
        List<SupportTicketResponse> inbox = supportTicketRepository.findInboxByAssignedUserId(user.getId()).stream()
                .filter(ticket -> !ticket.getUser().getId().equals(user.getId()))
                .map(ticket -> toResponse(ticket, user, true))
                .toList();

        if (roleService.isAdmin(user)) {
            List<SupportTicketResponse> platformTickets = supportTicketRepository
                    .findPlatformTickets(SupportRoutingTarget.PLATFORM).stream()
                    .map(ticket -> toResponse(ticket, user, true))
                    .toList();
            inbox = mergeDistinct(inbox, platformTickets);
        }

        return SupportTicketListResponse.builder().tickets(inbox).build();
    }

    @Transactional(readOnly = true)
    public SupportTicketResponse getTicket(User user, Long ticketId) {
        SupportTicket ticket = loadAccessibleTicket(user, ticketId);
        boolean inbox = isInboxTicket(user, ticket);
        return toResponse(ticket, user, inbox);
    }

    @Transactional(readOnly = true)
    public SupportRoutingPreviewResponse previewRouting(User user, SupportRoutingPreviewRequest request) {
        SupportRoutingDecision decision = supportTicketRouter.route(
                user,
                request.getCategory(),
                request.getTenancyId(),
                null,
                request.getPropertyId());
        return toPreview(decision, request.getCategory());
    }

    @Transactional
    public SupportTicketResponse createTicket(User user, CreateSupportTicketRequest request) {
        SupportRoutingDecision routing = supportTicketRouter.route(
                user,
                request.getCategory(),
                request.getTenancyId(),
                request.getUnitId(),
                request.getPropertyId());

        SupportTicket ticket = new SupportTicket();
        ticket.setReferenceCode(generateReferenceCode());
        ticket.setUser(user);
        ticket.setPortalRole(user.getUserType());
        ticket.setRequesterName(user.getFullName());
        ticket.setSubject(request.getSubject().trim());
        ticket.setCategory(request.getCategory().trim().toLowerCase());
        ticket.setPriority(request.getPriority());
        ticket.setDescription(request.getDescription().trim());
        ticket.setStatus(SupportTicketStatus.OPEN);
        ticket.setRoutingTarget(routing.getRoutingTarget());
        ticket.setAssignedUser(routing.getAssignedUser());
        ticket.setRoutingReason(routing.getRoutingReason());
        ticket.setContextLabel(routing.getContextLabel());
        ticket.setTenancyId(routing.getTenancyId());
        ticket.setUnitId(routing.getUnitId());
        ticket.setPropertyId(routing.getPropertyId());

        SupportTicketMessage initialMessage = new SupportTicketMessage();
        initialMessage.setTicket(ticket);
        initialMessage.setMessage(request.getDescription().trim());
        initialMessage.setFromUser(true);
        initialMessage.setAuthorName(user.getFullName());
        ticket.getMessages().add(initialMessage);

        SupportTicketMessage acknowledgement = new SupportTicketMessage();
        acknowledgement.setTicket(ticket);
        acknowledgement.setMessage(routing.getAcknowledgementMessage());
        acknowledgement.setFromUser(false);
        acknowledgement.setAuthorName(resolveTeamName(routing.getRoutingTarget()));
        ticket.getMessages().add(acknowledgement);

        SupportTicket saved = supportTicketRepository.save(ticket);
        return toResponse(saved, user, false);
    }

    @Transactional
    public SupportTicketResponse replyToTicket(User user, Long ticketId, ReplySupportTicketRequest request) {
        SupportTicket ticket = loadAccessibleTicket(user, ticketId);

        if (ticket.getStatus() == SupportTicketStatus.CLOSED) {
            throw new BadRequestException("This ticket is closed. Please open a new ticket for further assistance.");
        }

        boolean isRequester = ticket.getUser().getId().equals(user.getId());
        boolean isAssignee = ticket.getAssignedUser() != null
                && ticket.getAssignedUser().getId().equals(user.getId());
        boolean isPlatformResponder = roleService.isAdmin(user)
                && ticket.getRoutingTarget() == SupportRoutingTarget.PLATFORM;

        if (!isRequester && !isAssignee && !isPlatformResponder) {
            throw new BadRequestException("You do not have permission to reply to this ticket.");
        }

        SupportTicketMessage reply = new SupportTicketMessage();
        reply.setTicket(ticket);
        reply.setMessage(request.getMessage().trim());
        reply.setFromUser(isRequester);
        reply.setAuthorName(user.getFullName());
        ticket.getMessages().add(reply);

        if (ticket.getStatus() == SupportTicketStatus.RESOLVED) {
            ticket.setStatus(SupportTicketStatus.IN_PROGRESS);
        } else if (!isRequester && ticket.getStatus() == SupportTicketStatus.OPEN) {
            ticket.setStatus(SupportTicketStatus.IN_PROGRESS);
        }

        SupportTicket saved = supportTicketRepository.save(ticket);
        return toResponse(saved, user, isInboxTicket(user, saved));
    }

    private SupportTicket loadAccessibleTicket(User user, Long ticketId) {
        if (roleService.isAdmin(user)) {
            return supportTicketRepository.findAccessibleIncludingPlatform(
                            ticketId, user.getId(), SupportRoutingTarget.PLATFORM)
                    .orElseThrow(() -> new ResourceNotFoundException("Support ticket not found"));
        }
        return supportTicketRepository.findAccessibleByUser(ticketId, user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Support ticket not found"));
    }

    private boolean isInboxTicket(User user, SupportTicket ticket) {
        if (ticket.getUser().getId().equals(user.getId())) {
            return false;
        }
        if (ticket.getAssignedUser() != null && ticket.getAssignedUser().getId().equals(user.getId())) {
            return true;
        }
        return roleService.isAdmin(user) && ticket.getRoutingTarget() == SupportRoutingTarget.PLATFORM;
    }

    private SupportTicketResponse toResponse(SupportTicket ticket, User viewer, boolean inboxTicket) {
        String assigneeName = ticket.getAssignedUser() != null
                ? ticket.getAssignedUser().getFullName()
                : (ticket.getRoutingTarget() == SupportRoutingTarget.PLATFORM ? PLATFORM_TEAM_NAME : null);

        return SupportTicketResponse.builder()
                .id(ticket.getId())
                .referenceCode(ticket.getReferenceCode())
                .subject(ticket.getSubject())
                .category(ticket.getCategory())
                .priority(ticket.getPriority())
                .status(ticket.getStatus())
                .description(ticket.getDescription())
                .createdAt(ticket.getCreatedAt())
                .updatedAt(ticket.getUpdatedAt())
                .messages(ticket.getMessages().stream().map(this::toMessageResponse).toList())
                .routingTarget(ticket.getRoutingTarget())
                .routingReason(ticket.getRoutingReason())
                .contextLabel(ticket.getContextLabel())
                .tenancyId(ticket.getTenancyId())
                .unitId(ticket.getUnitId())
                .propertyId(ticket.getPropertyId())
                .requesterName(ticket.getRequesterName())
                .assigneeName(assigneeName)
                .inboxTicket(inboxTicket)
                .platformTicket(ticket.getRoutingTarget() == SupportRoutingTarget.PLATFORM)
                .build();
    }

    private SupportRoutingPreviewResponse toPreview(SupportRoutingDecision decision, String category) {
        String normalized = category == null ? "other" : category.trim().toLowerCase();
        return SupportRoutingPreviewResponse.builder()
                .routingTarget(decision.getRoutingTarget())
                .routingTargetLabel(labelForTarget(decision.getRoutingTarget()))
                .routingReason(decision.getRoutingReason())
                .contextLabel(decision.getContextLabel())
                .assigneeName(decision.getAssignedUser() != null
                        ? decision.getAssignedUser().getFullName()
                        : PLATFORM_TEAM_NAME)
                .requiresTenancy(requiresTenancy(normalized))
                .requiresProperty(requiresProperty(normalized))
                .build();
    }

    private boolean requiresTenancy(String category) {
        return Set.of(
                "unit_maintenance", "unit_lease", "unit_access", "unit_issue",
                "payment_rent", "payment", "tenant_issue", "tenant_dispute", "tenant_management"
        ).contains(category);
    }

    private boolean requiresProperty(String category) {
        return Set.of("agent_coordination", "owner_coordination", "properties", "property_setup").contains(category);
    }

    private String labelForTarget(SupportRoutingTarget target) {
        return switch (target) {
            case LANDLORD -> "Your landlord";
            case AGENT -> "Your property agent";
            case PLATFORM -> "Mkeja platform team";
        };
    }

    private String resolveTeamName(SupportRoutingTarget target) {
        return switch (target) {
            case LANDLORD -> "Landlord notification";
            case AGENT -> "Agent notification";
            case PLATFORM -> PLATFORM_TEAM_NAME;
        };
    }

    private SupportTicketMessageResponse toMessageResponse(SupportTicketMessage message) {
        return SupportTicketMessageResponse.builder()
                .id(message.getId())
                .message(message.getMessage())
                .fromUser(message.isFromUser())
                .authorName(message.getAuthorName())
                .createdAt(message.getCreatedAt())
                .build();
    }

    private String generateReferenceCode() {
        for (int attempt = 0; attempt < 8; attempt++) {
            String code = "TKT-" + ThreadLocalRandom.current().nextInt(100000, 999999);
            if (!supportTicketRepository.existsByReferenceCode(code)) {
                return code;
            }
        }
        throw new BadRequestException("Unable to generate ticket reference. Please try again.");
    }

    private List<SupportTicketResponse> mergeDistinct(
            List<SupportTicketResponse> primary,
            List<SupportTicketResponse> secondary) {
        java.util.LinkedHashMap<Long, SupportTicketResponse> merged = new LinkedHashMap<>();
        primary.forEach(ticket -> merged.put(ticket.getId(), ticket));
        secondary.forEach(ticket -> merged.putIfAbsent(ticket.getId(), ticket));
        return List.copyOf(merged.values());
    }
}

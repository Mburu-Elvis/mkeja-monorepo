package co.ke.mkeja.onboarding.controller;

import co.ke.mkeja.onboarding.dto.request.CreateSupportTicketRequest;
import co.ke.mkeja.onboarding.dto.request.ReplySupportTicketRequest;
import co.ke.mkeja.onboarding.dto.request.SupportRoutingPreviewRequest;
import co.ke.mkeja.onboarding.dto.response.SupportContextOptionResponse;
import co.ke.mkeja.onboarding.dto.response.SupportRoutingPreviewResponse;
import co.ke.mkeja.onboarding.dto.response.SupportTicketListResponse;
import co.ke.mkeja.onboarding.dto.response.SupportTicketResponse;
import co.ke.mkeja.onboarding.model.entity.User;
import co.ke.mkeja.onboarding.service.SupportContextService;
import co.ke.mkeja.onboarding.service.SupportTicketService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/support")
@RequiredArgsConstructor
public class SupportController {

    private final SupportTicketService supportTicketService;
    private final SupportContextService supportContextService;

    @GetMapping("/tickets")
    public SupportTicketListResponse listSubmittedTickets(@AuthenticationPrincipal User user) {
        return supportTicketService.listSubmittedTickets(user);
    }

    @GetMapping("/inbox")
    public SupportTicketListResponse listInboxTickets(@AuthenticationPrincipal User user) {
        return supportTicketService.listInboxTickets(user);
    }

    @GetMapping("/context-options")
    public SupportContextOptionResponse contextOptions(@AuthenticationPrincipal User user) {
        return supportContextService.getContextOptions(user);
    }

    @PostMapping("/routing-preview")
    public SupportRoutingPreviewResponse previewRouting(
            @AuthenticationPrincipal User user,
            @Valid @RequestBody SupportRoutingPreviewRequest request) {
        return supportTicketService.previewRouting(user, request);
    }

    @GetMapping("/tickets/{ticketId}")
    public SupportTicketResponse getTicket(
            @AuthenticationPrincipal User user,
            @PathVariable Long ticketId) {
        return supportTicketService.getTicket(user, ticketId);
    }

    @PostMapping("/tickets")
    public SupportTicketResponse createTicket(
            @AuthenticationPrincipal User user,
            @Valid @RequestBody CreateSupportTicketRequest request) {
        return supportTicketService.createTicket(user, request);
    }

    @PostMapping("/tickets/{ticketId}/replies")
    public SupportTicketResponse replyToTicket(
            @AuthenticationPrincipal User user,
            @PathVariable Long ticketId,
            @Valid @RequestBody ReplySupportTicketRequest request) {
        return supportTicketService.replyToTicket(user, ticketId, request);
    }
}

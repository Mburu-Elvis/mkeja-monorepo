package co.ke.mkeja.onboarding.controller;

import co.ke.mkeja.onboarding.dto.response.AdminInvitationSummaryResponse;
import co.ke.mkeja.onboarding.model.entity.User;
import co.ke.mkeja.onboarding.service.AdminInvitationService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/admin/invitations")
@RequiredArgsConstructor
public class AdminInvitationController {

    private final AdminInvitationService adminInvitationService;

    @GetMapping
    public List<AdminInvitationSummaryResponse> listInvitations(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String search) {
        return adminInvitationService.listInvitations(status, search);
    }

    @PostMapping("/{invitationId}/cancel")
    public AdminInvitationSummaryResponse cancelInvitation(@PathVariable Long invitationId,
                                                           @AuthenticationPrincipal User admin) {
        return adminInvitationService.cancelInvitation(invitationId, admin);
    }
}

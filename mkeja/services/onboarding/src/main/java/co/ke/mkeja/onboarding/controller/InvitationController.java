package co.ke.mkeja.onboarding.controller;

import co.ke.mkeja.onboarding.dto.request.CreateInvitationRequest;
import co.ke.mkeja.onboarding.dto.response.InvitationResponse;
import co.ke.mkeja.onboarding.model.entity.User;
import co.ke.mkeja.onboarding.service.InvitationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/invitations")
@RequiredArgsConstructor
public class InvitationController {

    private final InvitationService invitationService;

    @PostMapping
    public InvitationResponse create(@Valid @RequestBody CreateInvitationRequest request,
                                     @AuthenticationPrincipal User landlord) {
        return invitationService.createInvitation(request, landlord);
    }

    @GetMapping("/{code}")
    public InvitationResponse get(@PathVariable String code) {
        return invitationService.getInvitation(code);
    }

    @PostMapping("/{code}/accept")
    public Map<String, String> accept(@PathVariable String code) {
        invitationService.acceptInvitation(code);
        return Map.of("message", "Invitation accepted");
    }
}

package co.ke.mkeja.onboarding.controller;

import co.ke.mkeja.onboarding.dto.response.KycDocumentUploadResponse;
import co.ke.mkeja.onboarding.dto.response.TenantInvitationSummaryResponse;
import co.ke.mkeja.onboarding.dto.response.TenantOnboardingContextResponse;
import co.ke.mkeja.onboarding.dto.response.TenantTenancyHistoryResponse;
import co.ke.mkeja.onboarding.exception.ResourceNotFoundException;
import co.ke.mkeja.onboarding.model.entity.Tenant;
import co.ke.mkeja.onboarding.model.entity.User;
import co.ke.mkeja.onboarding.repository.TenantRepository;
import co.ke.mkeja.onboarding.service.InvitationService;
import co.ke.mkeja.onboarding.service.TenantOnboardingService;
import co.ke.mkeja.onboarding.service.TenantTenancyService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

@RestController
@RequestMapping("/api/v1/tenant")
@RequiredArgsConstructor
public class TenantController {

    private final TenantTenancyService tenantTenancyService;
    private final TenantOnboardingService tenantOnboardingService;
    private final InvitationService invitationService;
    private final TenantRepository tenantRepository;

    @GetMapping("/me/onboarding")
    public TenantOnboardingContextResponse onboardingContext(@AuthenticationPrincipal User user) {
        return tenantOnboardingService.getOnboardingContext(user);
    }

    @GetMapping("/me/invitations")
    public List<TenantInvitationSummaryResponse> myInvitations(@AuthenticationPrincipal User user) {
        return invitationService.listPendingInvitationsForTenant(user);
    }

    @GetMapping("/tenancies")
    public TenantTenancyHistoryResponse tenancyHistory(@AuthenticationPrincipal User user) {
        return tenantTenancyService.getTenancyHistory(user);
    }

    @PostMapping(value = "/me/documents", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public KycDocumentUploadResponse uploadMyDocuments(
            @AuthenticationPrincipal User user,
            @RequestPart(value = "idFront", required = false) MultipartFile idFront,
            @RequestPart(value = "idBack", required = false) MultipartFile idBack,
            @RequestPart(value = "selfie", required = false) MultipartFile selfie) throws IOException {
        Tenant tenant = tenantRepository.findByUserId(user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Tenant profile not found"));
        return tenantOnboardingService.uploadDocuments(tenant.getId(), idFront, idBack, selfie);
    }
}

package co.ke.mkeja.onboarding.controller;

import co.ke.mkeja.onboarding.dto.request.LoginRequest;
import co.ke.mkeja.onboarding.dto.request.RegisterRequest;
import co.ke.mkeja.onboarding.dto.request.ResendOtpRequest;
import co.ke.mkeja.onboarding.dto.request.VerifyOtpRequest;
import co.ke.mkeja.onboarding.dto.response.AuthResponse;
import co.ke.mkeja.onboarding.dto.response.KycDocumentUploadResponse;
import co.ke.mkeja.onboarding.dto.response.TenantInvitationSummaryResponse;
import co.ke.mkeja.onboarding.dto.response.TenantOnboardingContextResponse;
import co.ke.mkeja.onboarding.dto.response.TenantTenancyHistoryResponse;
import co.ke.mkeja.onboarding.exception.BadRequestException;
import co.ke.mkeja.onboarding.exception.ResourceNotFoundException;
import co.ke.mkeja.onboarding.model.entity.Tenant;
import co.ke.mkeja.onboarding.model.entity.User;
import co.ke.mkeja.onboarding.repository.TenantRepository;
import co.ke.mkeja.onboarding.service.AuthService;
import co.ke.mkeja.onboarding.service.InvitationService;
import co.ke.mkeja.onboarding.service.TenantOnboardingService;
import co.ke.mkeja.onboarding.service.TenantTenancyService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final InvitationService invitationService;
    private final TenantOnboardingService tenantOnboardingService;
    private final TenantTenancyService tenantTenancyService;
    private final TenantRepository tenantRepository;

    @PostMapping("/register")
    public AuthResponse register(@Valid @RequestBody RegisterRequest request) {
        return authService.register(request);
    }

    @PostMapping("/login")
    public AuthResponse login(@Valid @RequestBody LoginRequest request) {
        return authService.login(request);
    }

    @PostMapping("/verify-otp")
    public AuthResponse verifyOtp(@Valid @RequestBody VerifyOtpRequest request) {
        return authService.verifyOtp(request);
    }

    @PostMapping("/resend-otp")
    public AuthResponse resendOtp(@Valid @RequestBody ResendOtpRequest request) {
        return authService.resendOtp(request);
    }

    @PostMapping("/refresh")
    public AuthResponse refresh(@AuthenticationPrincipal User user) {
        if (user == null) {
            throw new BadRequestException("Not authenticated");
        }
        return authService.refresh(user);
    }

    @GetMapping("/tenant/onboarding")
    public TenantOnboardingContextResponse tenantOnboardingContext(@AuthenticationPrincipal User user) {
        if (user == null) {
            throw new BadRequestException("Not authenticated");
        }
        return tenantOnboardingService.getOnboardingContext(user);
    }

    @GetMapping("/tenant/invitations")
    public List<TenantInvitationSummaryResponse> tenantInvitations(@AuthenticationPrincipal User user) {
        if (user == null) {
            throw new BadRequestException("Not authenticated");
        }
        return invitationService.listPendingInvitationsForTenant(user);
    }

    @GetMapping("/tenant/tenancies")
    public TenantTenancyHistoryResponse tenantTenancyHistory(@AuthenticationPrincipal User user) {
        if (user == null) {
            throw new BadRequestException("Not authenticated");
        }
        return tenantTenancyService.getTenancyHistory(user);
    }

    @PostMapping(value = "/tenant/documents", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public KycDocumentUploadResponse uploadTenantDocuments(
            @AuthenticationPrincipal User user,
            @RequestPart(value = "idFront", required = false) MultipartFile idFront,
            @RequestPart(value = "idBack", required = false) MultipartFile idBack,
            @RequestPart(value = "selfie", required = false) MultipartFile selfie) throws IOException {
        if (user == null) {
            throw new BadRequestException("Not authenticated");
        }
        Tenant tenant = tenantRepository.findByUserId(user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Tenant profile not found"));
        return tenantOnboardingService.uploadDocuments(tenant.getId(), idFront, idBack, selfie);
    }
}

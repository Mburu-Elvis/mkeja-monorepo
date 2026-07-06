package co.ke.mkeja.onboarding.controller;

import co.ke.mkeja.onboarding.dto.request.PaymentPlanRequest;
import co.ke.mkeja.onboarding.dto.request.RatibaSetupRequest;
import co.ke.mkeja.onboarding.dto.request.SignLeaseRequest;
import co.ke.mkeja.onboarding.dto.request.TenantRegisterRequest;
import co.ke.mkeja.onboarding.dto.response.*;
import co.ke.mkeja.onboarding.service.PaymentService;
import co.ke.mkeja.onboarding.service.RatibaService;
import co.ke.mkeja.onboarding.service.TenantOnboardingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

@RestController
@RequestMapping("/api/v1/onboarding/tenants")
@RequiredArgsConstructor
public class TenantOnboardingController {

    private final TenantOnboardingService tenantOnboardingService;
    private final PaymentService paymentService;
    private final RatibaService ratibaService;

    @PostMapping("/register")
    public TenantRegisterResponse register(@Valid @RequestBody TenantRegisterRequest request) {
        return tenantOnboardingService.register(request);
    }

    @PostMapping(value = "/{tenantId}/documents", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public KycDocumentUploadResponse uploadDocuments(
            @PathVariable Long tenantId,
            @RequestPart(value = "idFront", required = false) MultipartFile idFront,
            @RequestPart(value = "idBack", required = false) MultipartFile idBack,
            @RequestPart(value = "selfie", required = false) MultipartFile selfie) throws IOException {
        return tenantOnboardingService.uploadDocuments(tenantId, idFront, idBack, selfie);
    }

    @PostMapping("/{tenantId}/security-deposit")
    public SecurityDepositResponse initiateDeposit(@PathVariable Long tenantId) {
        return paymentService.initiateDeposit(tenantId);
    }

    @GetMapping("/{tenantId}/security-deposit/status")
    public SecurityDepositResponse depositStatus(@PathVariable Long tenantId) {
        return paymentService.getDepositStatus(tenantId);
    }

    @GetMapping("/{tenantId}/lease")
    public LeaseSummaryResponse leaseSummary(@PathVariable Long tenantId,
                                             @RequestParam String code) {
        return tenantOnboardingService.getLeaseSummary(tenantId, code);
    }

    @PostMapping("/{tenantId}/lease/sign")
    public TenancyCreationResponse signLease(@PathVariable Long tenantId,
                                             @Valid @RequestBody SignLeaseRequest request) {
        return tenantOnboardingService.signLease(tenantId, request.getInvitationCode());
    }

    @PostMapping("/{tenantId}/payment-plan")
    public MapResponse setPaymentPlan(@PathVariable Long tenantId, @Valid @RequestBody PaymentPlanRequest request) {
        tenantOnboardingService.setPaymentPlan(tenantId, request);
        return new MapResponse("Payment plan saved");
    }

    @PostMapping("/{tenantId}/ratiba")
    public RatibaSetupResponse setupRatiba(@PathVariable Long tenantId, @Valid @RequestBody RatibaSetupRequest request) {
        return ratibaService.setupRatiba(tenantId, request);
    }

    @GetMapping("/{tenantId}/profile")
    public TenantProfileResponse profile(@PathVariable Long tenantId) {
        return tenantOnboardingService.getProfile(tenantId);
    }

    public record MapResponse(String message) {}
}

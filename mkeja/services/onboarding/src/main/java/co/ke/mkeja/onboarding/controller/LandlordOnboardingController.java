package co.ke.mkeja.onboarding.controller;

import co.ke.mkeja.onboarding.dto.request.LandlordOnboardingRequest;
import co.ke.mkeja.onboarding.dto.response.KycDocumentUploadResponse;
import co.ke.mkeja.onboarding.dto.response.LandlordOnboardingResponse;
import co.ke.mkeja.onboarding.dto.response.OnboardingStatusResponse;
import co.ke.mkeja.onboarding.service.LandlordOnboardingService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/onboarding/landlords")
@RequiredArgsConstructor
public class LandlordOnboardingController {

    private final LandlordOnboardingService landlordOnboardingService;

    @PostMapping
    public LandlordOnboardingResponse submit(@RequestBody LandlordOnboardingRequest request) throws IOException {
        return landlordOnboardingService.submit(request);
    }

    @PostMapping("/{id}/documents")
    public KycDocumentUploadResponse uploadDocuments(@PathVariable Long id, @RequestBody Map<String, String> docs) throws IOException {
        return landlordOnboardingService.uploadDocuments(id, docs);
    }

    @GetMapping("/{id}/status")
    public OnboardingStatusResponse getStatus(@PathVariable Long id) {
        return landlordOnboardingService.getStatus(id);
    }
}

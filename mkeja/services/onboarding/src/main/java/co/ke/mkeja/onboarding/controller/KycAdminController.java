package co.ke.mkeja.onboarding.controller;

import co.ke.mkeja.onboarding.dto.request.KycRejectRequest;
import co.ke.mkeja.onboarding.dto.response.KycApplicationResponse;
import co.ke.mkeja.onboarding.service.KycAdminService;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/admin/kyc-queue")
@RequiredArgsConstructor
public class KycAdminController {

    private final KycAdminService kycAdminService;

    @GetMapping
    public List<KycApplicationResponse> list() {
        return kycAdminService.listApplications();
    }

    @GetMapping("/{id}")
    public KycApplicationResponse get(@PathVariable String id, @RequestParam(defaultValue = "TENANT") String type) {
        return kycAdminService.getApplication(id, type);
    }

    @PostMapping("/{id}/approve")
    public Map<String, String> approve(@PathVariable String id, @RequestParam(defaultValue = "TENANT") String type) {
        kycAdminService.approve(id, type);
        return Map.of("message", "Application approved");
    }

    @PostMapping("/{id}/reject")
    public Map<String, String> reject(@PathVariable String id,
                                        @RequestParam(defaultValue = "TENANT") String type,
                                        @RequestBody(required = false) KycRejectRequest request) {
        kycAdminService.reject(id, type, request != null ? request.getReason() : null);
        return Map.of("message", "Application rejected");
    }

    @PostMapping("/{id}/flag")
    public Map<String, String> flag(@PathVariable String id, @RequestParam(defaultValue = "TENANT") String type) {
        kycAdminService.flagForReview(id, type);
        return Map.of("message", "Application flagged for manual review");
    }

    @GetMapping("/documents/{documentId}")
    public ResponseEntity<Resource> downloadDocument(@PathVariable Long documentId) throws IOException {
        Resource resource = kycAdminService.loadDocument(documentId);
        String contentType = kycAdminService.getDocumentContentType(documentId);
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(contentType))
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"document-" + documentId + "\"")
                .body(resource);
    }
}

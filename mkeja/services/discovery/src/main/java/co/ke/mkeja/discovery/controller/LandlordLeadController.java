package co.ke.mkeja.discovery.controller;

import co.ke.mkeja.discovery.dto.ListingInterestResponse;
import co.ke.mkeja.discovery.model.enums.InterestStatus;
import co.ke.mkeja.discovery.security.AuthUser;
import co.ke.mkeja.discovery.service.ListingInterestService;
import co.ke.mkeja.discovery.service.TenantContextService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/discovery/leads")
@RequiredArgsConstructor
public class LandlordLeadController {

    private final ListingInterestService listingInterestService;
    private final TenantContextService tenantContextService;

    @GetMapping
    public List<ListingInterestResponse> listLeads(@AuthenticationPrincipal AuthUser user) {
        Long landlordUserId = tenantContextService.requireLandlordUserId(user.getUsername());
        return listingInterestService.listLandlordLeads(landlordUserId);
    }

    @PatchMapping("/{leadId}/status")
    public ListingInterestResponse updateStatus(@AuthenticationPrincipal AuthUser user,
                                                @PathVariable Long leadId,
                                                @RequestParam InterestStatus status) {
        Long landlordUserId = tenantContextService.requireLandlordUserId(user.getUsername());
        return listingInterestService.updateLeadStatus(landlordUserId, leadId, status);
    }

    @PostMapping("/{leadId}/contacted")
    public ListingInterestResponse markContacted(@AuthenticationPrincipal AuthUser user, @PathVariable Long leadId) {
        Long landlordUserId = tenantContextService.requireLandlordUserId(user.getUsername());
        return listingInterestService.updateLeadStatus(landlordUserId, leadId, InterestStatus.CONTACTED);
    }

    @PostMapping("/{leadId}/decline")
    public Map<String, String> decline(@AuthenticationPrincipal AuthUser user, @PathVariable Long leadId) {
        Long landlordUserId = tenantContextService.requireLandlordUserId(user.getUsername());
        listingInterestService.updateLeadStatus(landlordUserId, leadId, InterestStatus.DECLINED);
        return Map.of("message", "Lead declined");
    }
}

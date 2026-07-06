package co.ke.mkeja.discovery.controller;

import co.ke.mkeja.discovery.dto.*;
import co.ke.mkeja.discovery.security.AuthUser;
import co.ke.mkeja.discovery.service.*;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Set;

@RestController
@RequestMapping("/api/v1/discovery")
@RequiredArgsConstructor
public class DiscoveryController {

    private final CatalogService catalogService;
    private final RecommendationService recommendationService;
    private final SavedListingService savedListingService;
    private final ListingInterestService listingInterestService;
    private final TenantContextService tenantContextService;

    @GetMapping("/properties")
    public List<PropertyListingResponse> searchProperties(
            @AuthenticationPrincipal AuthUser user,
            @RequestParam(required = false) String q,
            @RequestParam(required = false) String county,
            @RequestParam(required = false) String city,
            @RequestParam(required = false) Double minRent,
            @RequestParam(required = false) Double maxRent,
            @RequestParam(required = false) Integer minBedrooms) {
        return catalogService.searchProperties(q, county, city, minRent, maxRent, minBedrooms, resolveSavedUnitIds(user));
    }

    @GetMapping("/properties/{propertyId}")
    public PropertyListingDetailResponse getPropertyListing(@AuthenticationPrincipal AuthUser user,
                                                            @PathVariable Long propertyId) {
        return catalogService.getPropertyListing(propertyId, resolveSavedUnitIds(user));
    }

    @GetMapping("/listings")
    public List<ListingResponse> searchListings(
            @AuthenticationPrincipal AuthUser user,
            @RequestParam(required = false) String q,
            @RequestParam(required = false) String county,
            @RequestParam(required = false) String city,
            @RequestParam(required = false) Double minRent,
            @RequestParam(required = false) Double maxRent,
            @RequestParam(required = false) Integer minBedrooms) {
        return catalogService.searchListings(q, county, city, minRent, maxRent, minBedrooms, resolveSavedUnitIds(user));
    }

    @GetMapping("/listings/{unitId}")
    public ListingResponse getListing(@AuthenticationPrincipal AuthUser user, @PathVariable Long unitId) {
        return catalogService.getListing(unitId, resolveSavedUnitIds(user));
    }

    @GetMapping("/recommendations")
    public List<PropertyListingResponse> recommendations(@AuthenticationPrincipal AuthUser user,
                                                         @RequestParam(defaultValue = "20") int limit) {
        var tenant = tenantContextService.requireApprovedTenant(user.getUsername());
        return recommendationService.recommendPropertiesForTenant(tenant, Math.min(limit, 50));
    }

    @GetMapping("/saved")
    public List<ListingResponse> savedListings(@AuthenticationPrincipal AuthUser user) {
        var tenant = tenantContextService.requireApprovedTenant(user.getUsername());
        return savedListingService.listSaved(tenant.userId());
    }

    @PostMapping("/listings/{unitId}/save")
    public ListingResponse saveListing(@AuthenticationPrincipal AuthUser user, @PathVariable Long unitId) {
        var tenant = tenantContextService.requireApprovedTenant(user.getUsername());
        return savedListingService.saveListing(tenant.userId(), unitId);
    }

    @DeleteMapping("/listings/{unitId}/save")
    public Map<String, String> unsaveListing(@AuthenticationPrincipal AuthUser user, @PathVariable Long unitId) {
        var tenant = tenantContextService.requireApprovedTenant(user.getUsername());
        savedListingService.unsaveListing(tenant.userId(), unitId);
        return Map.of("message", "Listing removed from saved");
    }

    @PostMapping("/listings/{unitId}/interest")
    public ListingInterestResponse expressInterest(@AuthenticationPrincipal AuthUser user,
                                                   @PathVariable Long unitId,
                                                   @RequestBody(required = false) InterestRequest request) {
        var tenant = tenantContextService.requireApprovedTenant(user.getUsername());
        return listingInterestService.expressInterest(tenant, unitId, request);
    }

    @PostMapping("/listings/{unitId}/public-interest")
    public ListingInterestResponse expressPublicInterest(@PathVariable Long unitId,
                                                         @RequestBody PublicInterestRequest request) {
        return listingInterestService.expressPublicInterest(unitId, request);
    }

    @GetMapping("/preferences")
    public TenantPreferenceResponse getPreferences(@AuthenticationPrincipal AuthUser user) {
        var tenant = tenantContextService.requireApprovedTenant(user.getUsername());
        return recommendationService.getPreferences(tenant.userId());
    }

    @PutMapping("/preferences")
    public TenantPreferenceResponse updatePreferences(@AuthenticationPrincipal AuthUser user,
                                                      @RequestBody TenantPreferenceRequest request) {
        var tenant = tenantContextService.requireApprovedTenant(user.getUsername());
        return recommendationService.upsertPreferences(tenant.userId(), request);
    }

    private Set<Long> resolveSavedUnitIds(AuthUser user) {
        if (user == null) {
            return Set.of();
        }
        return tenantContextService.loadTenantContext(user.getUsername())
                .map(t -> savedListingService.savedUnitIds(t.userId()))
                .orElse(Set.of());
    }
}

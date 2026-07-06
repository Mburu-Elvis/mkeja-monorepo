package co.ke.mkeja.discovery.service;

import co.ke.mkeja.discovery.dto.ListingResponse;
import co.ke.mkeja.discovery.dto.PropertyListingResponse;
import co.ke.mkeja.discovery.dto.TenantPreferenceRequest;
import co.ke.mkeja.discovery.dto.TenantPreferenceResponse;
import co.ke.mkeja.discovery.model.entity.TenantPreference;
import co.ke.mkeja.discovery.repository.TenantPreferenceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class RecommendationService {

    private final CatalogService catalogService;
    private final TenantPreferenceRepository tenantPreferenceRepository;
    private final SavedListingService savedListingService;

    @Transactional(readOnly = true)
    public List<PropertyListingResponse> recommendPropertiesForTenant(TenantContextService.TenantContext tenant, int limit) {
        Set<Long> savedIds = savedListingService.savedUnitIds(tenant.userId());
        List<PropertyListingResponse> candidates = catalogService.listAutoRecommendPropertyCandidates(savedIds);

        if (candidates.isEmpty()) {
            candidates = catalogService.searchProperties(null, null, null, null, null, null, savedIds);
        }

        TenantPreference preference = tenantPreferenceRepository.findByTenantUserId(tenant.userId()).orElse(null);

        return candidates.stream()
                .map(listing -> scoreProperty(listing, tenant, preference))
                .sorted(Comparator.comparing(PropertyListingResponse::getMatchScore).reversed())
                .limit(limit)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<ListingResponse> recommendForTenant(TenantContextService.TenantContext tenant, int limit) {
        Set<Long> savedIds = savedListingService.savedUnitIds(tenant.userId());
        List<ListingResponse> candidates = catalogService.listAutoRecommendCandidates(savedIds);

        if (candidates.isEmpty()) {
            candidates = catalogService.searchListings(null, null, null, null, null, null, savedIds);
        }

        TenantPreference preference = tenantPreferenceRepository.findByTenantUserId(tenant.userId()).orElse(null);

        return candidates.stream()
                .map(listing -> scoreListing(listing, tenant, preference))
                .sorted(Comparator.comparing(ListingResponse::getMatchScore).reversed())
                .limit(limit)
                .collect(Collectors.toList());
    }

    @Transactional
    public TenantPreferenceResponse upsertPreferences(Long tenantUserId, TenantPreferenceRequest request) {
        TenantPreference preference = tenantPreferenceRepository.findByTenantUserId(tenantUserId)
                .orElseGet(TenantPreference::new);
        preference.setTenantUserId(tenantUserId);
        preference.setMinRent(request.getMinRent());
        preference.setMaxRent(request.getMaxRent());
        preference.setPreferredCounty(request.getPreferredCounty());
        preference.setPreferredCity(request.getPreferredCity());
        preference.setMinBedrooms(request.getMinBedrooms());
        preference.setMoveByDate(request.getMoveByDate());
        tenantPreferenceRepository.save(preference);
        return toResponse(preference);
    }

    @Transactional(readOnly = true)
    public TenantPreferenceResponse getPreferences(Long tenantUserId) {
        return tenantPreferenceRepository.findByTenantUserId(tenantUserId)
                .map(this::toResponse)
                .orElse(TenantPreferenceResponse.builder().build());
    }

    private ListingResponse scoreListing(ListingResponse listing,
                                         TenantContextService.TenantContext tenant,
                                         TenantPreference preference) {
        double score = 0;
        List<String> reasons = new ArrayList<>();

        if (Boolean.TRUE.equals(listing.isPromoted())) {
            score += 15;
            reasons.add("Featured listing");
        }
        if (Boolean.TRUE.equals(listing.isAutoRecommend())) {
            score += 10;
            reasons.add("Landlord opted into recommendations");
        }
        if (Boolean.TRUE.equals(listing.isVerifiedProperty()) && Boolean.TRUE.equals(listing.isVerifiedLandlord())) {
            score += 8;
            reasons.add("Verified landlord & property");
        }

        Double budget = tenant.currentRent();
        if (budget != null && listing.getRent() != null) {
            double diff = Math.abs(listing.getRent() - budget) / Math.max(budget, 1);
            if (diff <= 0.15) {
                score += 25;
                reasons.add("Similar to your current rent");
            } else if (listing.getRent() <= budget) {
                score += 15;
                reasons.add("Within your current budget");
            }
        }

        if (tenant.currentCounty() != null && listing.getCounty() != null
                && tenant.currentCounty().equalsIgnoreCase(listing.getCounty())) {
            score += 20;
            reasons.add("Same county as your current home");
        } else if (tenant.currentCity() != null && listing.getCity() != null
                && tenant.currentCity().equalsIgnoreCase(listing.getCity())) {
            score += 15;
            reasons.add("Same city as your current home");
        }

        if (preference != null) {
            if (preference.getPreferredCounty() != null && listing.getCounty() != null
                    && preference.getPreferredCounty().equalsIgnoreCase(listing.getCounty())) {
                score += 12;
                reasons.add("Matches your preferred county");
            }
            if (preference.getPreferredCity() != null && listing.getCity() != null
                    && preference.getPreferredCity().equalsIgnoreCase(listing.getCity())) {
                score += 10;
                reasons.add("Matches your preferred city");
            }
            if (preference.getMaxRent() != null && listing.getRent() != null
                    && listing.getRent() <= preference.getMaxRent()) {
                score += 12;
                reasons.add("Within your max budget");
            }
            if (preference.getMinBedrooms() != null && listing.getBedrooms() != null
                    && listing.getBedrooms() >= preference.getMinBedrooms()) {
                score += 8;
                reasons.add("Meets bedroom preference");
            }
        }

        listing.setMatchScore(score);
        listing.setMatchReasons(reasons.isEmpty() ? List.of("Available verified listing") : reasons);
        return listing;
    }

    private PropertyListingResponse scoreProperty(PropertyListingResponse listing,
                                                  TenantContextService.TenantContext tenant,
                                                  TenantPreference preference) {
        double score = 0;
        List<String> reasons = new ArrayList<>();

        if (listing.isPromoted()) {
            score += 15;
            reasons.add("Featured property");
        }
        if (listing.isVerifiedProperty() && listing.isVerifiedLandlord()) {
            score += 8;
            reasons.add("Verified landlord & property");
        }

        Double budget = tenant.currentRent();
        if (budget != null && listing.getMinRent() != null) {
            if (listing.getMinRent() <= budget) {
                score += 15;
                reasons.add("Starts within your budget");
            }
        }

        if (tenant.currentCounty() != null && listing.getCounty() != null
                && tenant.currentCounty().equalsIgnoreCase(listing.getCounty())) {
            score += 20;
            reasons.add("Same county as your current home");
        } else if (tenant.currentCity() != null && listing.getCity() != null
                && tenant.currentCity().equalsIgnoreCase(listing.getCity())) {
            score += 15;
            reasons.add("Same city as your current home");
        }

        if (preference != null) {
            if (preference.getPreferredCounty() != null && listing.getCounty() != null
                    && preference.getPreferredCounty().equalsIgnoreCase(listing.getCounty())) {
                score += 12;
                reasons.add("Matches your preferred county");
            }
            if (preference.getMaxRent() != null && listing.getMinRent() != null
                    && listing.getMinRent() <= preference.getMaxRent()) {
                score += 12;
                reasons.add("Within your max budget");
            }
        }

        listing.setMatchScore(score);
        listing.setMatchReasons(reasons.isEmpty() ? List.of("Available verified property") : reasons);
        return listing;
    }

    private TenantPreferenceResponse toResponse(TenantPreference preference) {
        return TenantPreferenceResponse.builder()
                .minRent(preference.getMinRent())
                .maxRent(preference.getMaxRent())
                .preferredCounty(preference.getPreferredCounty())
                .preferredCity(preference.getPreferredCity())
                .minBedrooms(preference.getMinBedrooms())
                .moveByDate(preference.getMoveByDate())
                .build();
    }
}

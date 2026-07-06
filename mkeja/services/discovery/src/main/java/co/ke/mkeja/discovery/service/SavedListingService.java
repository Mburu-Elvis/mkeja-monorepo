package co.ke.mkeja.discovery.service;

import co.ke.mkeja.discovery.dto.ListingResponse;
import co.ke.mkeja.discovery.exception.BadRequestException;
import co.ke.mkeja.discovery.model.entity.SavedListing;
import co.ke.mkeja.discovery.repository.SavedListingRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SavedListingService {

    private final SavedListingRepository savedListingRepository;
    private final CatalogService catalogService;

    @Transactional(readOnly = true)
    public Set<Long> savedUnitIds(Long tenantUserId) {
        return savedListingRepository.findByTenantUserIdOrderByCreatedAtDesc(tenantUserId).stream()
                .map(SavedListing::getUnitId)
                .collect(Collectors.toSet());
    }

    @Transactional(readOnly = true)
    public List<ListingResponse> listSaved(Long tenantUserId) {
        Set<Long> savedIds = savedUnitIds(tenantUserId);
        return savedIds.stream()
                .map(unitId -> {
                    try {
                        return catalogService.getListing(unitId, savedIds);
                    } catch (Exception e) {
                        return null;
                    }
                })
                .filter(java.util.Objects::nonNull)
                .collect(Collectors.toList());
    }

    @Transactional
    public ListingResponse saveListing(Long tenantUserId, Long unitId) {
        catalogService.getListing(unitId, Set.of());
        if (savedListingRepository.findByTenantUserIdAndUnitId(tenantUserId, unitId).isPresent()) {
            throw new BadRequestException("Listing already saved");
        }
        SavedListing saved = new SavedListing();
        saved.setTenantUserId(tenantUserId);
        saved.setUnitId(unitId);
        savedListingRepository.save(saved);
        return catalogService.getListing(unitId, savedUnitIds(tenantUserId));
    }

    @Transactional
    public void unsaveListing(Long tenantUserId, Long unitId) {
        savedListingRepository.deleteByTenantUserIdAndUnitId(tenantUserId, unitId);
    }
}

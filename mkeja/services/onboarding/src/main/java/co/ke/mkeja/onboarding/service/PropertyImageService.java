package co.ke.mkeja.onboarding.service;

import co.ke.mkeja.onboarding.dto.response.PropertyImageResponse;
import co.ke.mkeja.onboarding.exception.BadRequestException;
import co.ke.mkeja.onboarding.exception.ResourceNotFoundException;
import co.ke.mkeja.onboarding.model.entity.Property;
import co.ke.mkeja.onboarding.model.entity.PropertyImage;
import co.ke.mkeja.onboarding.model.entity.User;
import co.ke.mkeja.onboarding.model.enums.UnitType;
import co.ke.mkeja.onboarding.repository.PropertyImageRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class PropertyImageService {

    private final PropertyImageRepository propertyImageRepository;
    private final FileStorageService fileStorageService;
    private final AuthorizationService authorizationService;

    public String mediaUrl(String storageKey) {
        return "/api/v1/media/" + storageKey;
    }

    @Transactional(readOnly = true)
    public List<PropertyImageResponse> listPropertyImages(User user, Long propertyId) {
        authorizationService.requirePropertyAccess(user, propertyId);
        return propertyImageRepository.findByPropertyIdAndDeletedAtIsNullOrderBySortOrderAsc(propertyId).stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<PropertyImageResponse> listOverviewImages(User user, Long propertyId) {
        authorizationService.requirePropertyAccess(user, propertyId);
        return propertyImageRepository
                .findByPropertyIdAndUnitIsNullAndUnitTypeIsNullAndDeletedAtIsNullOrderBySortOrderAsc(propertyId).stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<PropertyImageResponse> listUnitTypeSampleImages(User user, Long propertyId, UnitType unitType) {
        authorizationService.requirePropertyAccess(user, propertyId);
        return propertyImageRepository
                .findByPropertyIdAndUnitIsNullAndUnitTypeAndDeletedAtIsNullOrderBySortOrderAsc(propertyId, unitType).stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public PropertyImageResponse uploadOverviewImage(User user, Long propertyId, MultipartFile file, String caption)
            throws IOException {
        Property property = authorizationService.requirePropertyAccess(user, propertyId);
        return saveImage(property, null, null, file, caption);
    }

    @Transactional
    public PropertyImageResponse uploadUnitTypeSampleImage(User user, Long propertyId, UnitType unitType,
                                                           MultipartFile file, String caption) throws IOException {
        if (unitType == null) {
            throw new BadRequestException("Unit type is required for sample photos");
        }
        Property property = authorizationService.requirePropertyAccess(user, propertyId);
        return saveImage(property, null, unitType, file, caption);
    }

    /** @deprecated Use uploadOverviewImage instead */
    @Transactional
    public PropertyImageResponse uploadPropertyImage(User user, Long propertyId, MultipartFile file, String caption)
            throws IOException {
        return uploadOverviewImage(user, propertyId, file, caption);
    }

    @Transactional(readOnly = true)
    public String resolveCoverUrl(Long propertyId) {
        return propertyImageRepository
                .findFirstByPropertyIdAndUnitIsNullAndUnitTypeIsNullAndDeletedAtIsNullOrderByPrimaryImageDescSortOrderAsc(propertyId)
                .map(img -> mediaUrl(img.getStorageKey()))
                .orElse(null);
    }

    @Transactional(readOnly = true)
    public String resolveUnitTypeSampleUrl(Long propertyId, UnitType unitType) {
        if (unitType == null) {
            return null;
        }
        return propertyImageRepository
                .findFirstByPropertyIdAndUnitIsNullAndUnitTypeAndDeletedAtIsNullOrderByPrimaryImageDescSortOrderAsc(propertyId, unitType)
                .map(img -> mediaUrl(img.getStorageKey()))
                .orElse(null);
    }

    @Transactional(readOnly = true)
    public List<String> resolveOverviewImageUrls(Long propertyId) {
        return propertyImageRepository
                .findByPropertyIdAndUnitIsNullAndUnitTypeIsNullAndDeletedAtIsNullOrderBySortOrderAsc(propertyId).stream()
                .map(img -> mediaUrl(img.getStorageKey()))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<String> resolveUnitTypeImageUrls(Long propertyId, UnitType unitType) {
        if (unitType == null) {
            return List.of();
        }
        return propertyImageRepository
                .findByPropertyIdAndUnitIsNullAndUnitTypeAndDeletedAtIsNullOrderBySortOrderAsc(propertyId, unitType).stream()
                .map(img -> mediaUrl(img.getStorageKey()))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<String> resolveGalleryImageUrls(Long propertyId, UnitType unitType) {
        List<String> urls = new ArrayList<>(resolveOverviewImageUrls(propertyId));
        if (unitType != null) {
            urls.addAll(resolveUnitTypeImageUrls(propertyId, unitType));
        }
        return urls;
    }

    private PropertyImageResponse saveImage(Property property, co.ke.mkeja.onboarding.model.entity.PropertyUnit unit,
                                            UnitType unitType, MultipartFile file, String caption) throws IOException {
        if (file == null || file.isEmpty()) {
            throw new BadRequestException("Image file is required");
        }
        String prefix = unitType != null
                ? "property_" + property.getId() + "_type_" + unitType.name() + "_photo"
                : "property_" + property.getId() + "_overview_photo";
        String storageKey = fileStorageService.storeMultipart(file, prefix);

        PropertyImage image = new PropertyImage();
        image.setProperty(property);
        image.setUnit(unit);
        image.setUnitType(unitType);
        image.setStorageKey(storageKey);
        image.setCaption(caption);
        image.setPrimaryImage(false);
        image.setSortOrder((int) propertyImageRepository.count());
        image = propertyImageRepository.save(image);
        return toResponse(image);
    }

    private PropertyImageResponse toResponse(PropertyImage image) {
        return PropertyImageResponse.builder()
                .id(image.getId())
                .propertyId(image.getProperty().getId())
                .unitId(image.getUnit() != null ? image.getUnit().getId() : null)
                .unitType(image.getUnitType() != null ? image.getUnitType().name() : null)
                .url(mediaUrl(image.getStorageKey()))
                .caption(image.getCaption())
                .primary(image.isPrimaryImage())
                .sortOrder(image.getSortOrder())
                .build();
    }

    public org.springframework.core.io.Resource loadMedia(String storageKey) throws IOException {
        if (storageKey == null || storageKey.contains("..") || storageKey.contains("/")) {
            throw new ResourceNotFoundException("Invalid media key");
        }
        return fileStorageService.loadAsResource(storageKey);
    }

    public String contentType(String storageKey) throws IOException {
        return fileStorageService.probeContentType(storageKey);
    }
}

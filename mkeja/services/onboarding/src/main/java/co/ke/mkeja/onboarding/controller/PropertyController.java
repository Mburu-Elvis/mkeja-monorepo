package co.ke.mkeja.onboarding.controller;

import co.ke.mkeja.onboarding.dto.request.CreateUnitRequest;
import co.ke.mkeja.onboarding.dto.request.UpdateHouseHuntRequest;
import co.ke.mkeja.onboarding.dto.request.UpdateUnitListingRequest;
import co.ke.mkeja.onboarding.dto.request.UpdateUnitRequest;
import co.ke.mkeja.onboarding.dto.response.HouseHuntSettingsResponse;
import co.ke.mkeja.onboarding.dto.response.PropertyImageResponse;
import co.ke.mkeja.onboarding.dto.response.PropertyResponse;
import co.ke.mkeja.onboarding.dto.response.UnitResponse;
import co.ke.mkeja.onboarding.model.entity.User;
import co.ke.mkeja.onboarding.service.PropertyImageService;
import co.ke.mkeja.onboarding.service.PropertyService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

@RestController
@RequestMapping("/api/v1/properties")
@RequiredArgsConstructor
public class PropertyController {

    private final PropertyService propertyService;
    private final PropertyImageService propertyImageService;

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public PropertyResponse createProperty(
            @RequestPart("propertyData") String propertyData,
            @RequestPart(value = "images", required = false) List<MultipartFile> images,
            @RequestPart(value = "documents", required = false) List<MultipartFile> documents,
            @AuthenticationPrincipal User user) throws IOException {
        return propertyService.createProperty(user, propertyData, images, documents);
    }

    @GetMapping
    public List<PropertyResponse> listProperties(@AuthenticationPrincipal User user) {
        return propertyService.listProperties(user);
    }

    @GetMapping("/{propertyId}")
    public PropertyResponse getProperty(@PathVariable Long propertyId,
                                        @AuthenticationPrincipal User user) {
        return propertyService.getProperty(user, propertyId);
    }

    @PostMapping("/{propertyId}/units")
    public UnitResponse createUnit(@PathVariable Long propertyId,
                                   @RequestBody CreateUnitRequest request,
                                   @AuthenticationPrincipal User user) {
        return propertyService.createUnit(user, propertyId, request);
    }

    @PostMapping(value = "/{propertyId}/units/wizard", consumes = MediaType.APPLICATION_JSON_VALUE)
    public UnitResponse createUnitFromWizard(@PathVariable Long propertyId,
                                             @RequestBody String payload,
                                             @AuthenticationPrincipal User user) throws IOException {
        return propertyService.createUnitFromWizard(user, propertyId, payload);
    }

    @GetMapping("/{propertyId}/units")
    public List<UnitResponse> listUnits(@PathVariable Long propertyId,
                                        @RequestParam(defaultValue = "false") boolean vacant,
                                        @AuthenticationPrincipal User user) {
        return propertyService.listUnits(user, propertyId, vacant);
    }

    @GetMapping("/{propertyId}/unit-types")
    public List<String> listPropertyUnitTypes(@PathVariable Long propertyId,
                                              @AuthenticationPrincipal User user) {
        return propertyService.listPropertyUnitTypes(user, propertyId);
    }

    @GetMapping("/vacant-units")
    public List<UnitResponse> listVacantUnits(@AuthenticationPrincipal User user) {
        return propertyService.listVacantUnitsForLandlord(user);
    }

    @GetMapping("/{propertyId}/units/{unitId}/listing")
    public UnitResponse getUnitListing(@PathVariable Long propertyId,
                                       @PathVariable Long unitId,
                                       @AuthenticationPrincipal User user) {
        return propertyService.getUnitListing(user, propertyId, unitId);
    }

    @PatchMapping("/{propertyId}/units/{unitId}")
    public UnitResponse updateUnit(@PathVariable Long propertyId,
                                   @PathVariable Long unitId,
                                   @RequestBody UpdateUnitRequest request,
                                   @AuthenticationPrincipal User user) {
        return propertyService.updateUnit(user, propertyId, unitId, request);
    }

    @PatchMapping("/{propertyId}/units/{unitId}/listing")
    public UnitResponse updateUnitListing(@PathVariable Long propertyId,
                                          @PathVariable Long unitId,
                                          @RequestBody UpdateUnitListingRequest request,
                                          @AuthenticationPrincipal User user) {
        return propertyService.updateUnitListing(user, propertyId, unitId, request);
    }

    @GetMapping("/{propertyId}/house-hunt")
    public HouseHuntSettingsResponse getHouseHuntSettings(@PathVariable Long propertyId,
                                                          @AuthenticationPrincipal User user) {
        return propertyService.getHouseHuntSettings(user, propertyId);
    }

    @PatchMapping("/{propertyId}/house-hunt")
    public HouseHuntSettingsResponse updateHouseHuntSettings(@PathVariable Long propertyId,
                                                             @RequestBody UpdateHouseHuntRequest request,
                                                             @AuthenticationPrincipal User user) {
        return propertyService.updateHouseHuntSettings(user, propertyId, request);
    }

    @PostMapping(value = "/{propertyId}/images", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public PropertyImageResponse uploadPropertyImage(@PathVariable Long propertyId,
                                                     @RequestPart("file") MultipartFile file,
                                                     @RequestPart(value = "caption", required = false) String caption,
                                                     @AuthenticationPrincipal User user) throws IOException {
        return propertyImageService.uploadOverviewImage(user, propertyId, file, caption);
    }

    @PostMapping(value = "/{propertyId}/unit-types/{unitType}/images", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public PropertyImageResponse uploadUnitTypeSampleImage(@PathVariable Long propertyId,
                                                           @PathVariable String unitType,
                                                           @RequestPart("file") MultipartFile file,
                                                           @RequestPart(value = "caption", required = false) String caption,
                                                           @AuthenticationPrincipal User user) throws IOException {
        return propertyImageService.uploadUnitTypeSampleImage(
                user, propertyId, co.ke.mkeja.onboarding.model.enums.UnitType.valueOf(unitType.toUpperCase()), file, caption);
    }

    @GetMapping("/{propertyId}/images/overview")
    public List<PropertyImageResponse> listOverviewImages(@PathVariable Long propertyId,
                                                          @AuthenticationPrincipal User user) {
        return propertyImageService.listOverviewImages(user, propertyId);
    }

    @GetMapping("/{propertyId}/unit-types/{unitType}/images")
    public List<PropertyImageResponse> listUnitTypeSampleImages(@PathVariable Long propertyId,
                                                                @PathVariable String unitType,
                                                                @AuthenticationPrincipal User user) {
        return propertyImageService.listUnitTypeSampleImages(
                user, propertyId, co.ke.mkeja.onboarding.model.enums.UnitType.valueOf(unitType.toUpperCase()));
    }

    @GetMapping("/{propertyId}/images")
    public List<PropertyImageResponse> listPropertyImages(@PathVariable Long propertyId,
                                                          @AuthenticationPrincipal User user) {
        return propertyImageService.listPropertyImages(user, propertyId);
    }
}

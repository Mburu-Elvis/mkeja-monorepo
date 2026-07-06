package co.ke.mkeja.onboarding.controller;

import co.ke.mkeja.onboarding.dto.response.AdminPropertyDetailResponse;
import co.ke.mkeja.onboarding.dto.response.PropertyResponse;
import co.ke.mkeja.onboarding.dto.response.UnitResponse;
import co.ke.mkeja.onboarding.model.entity.User;
import co.ke.mkeja.onboarding.service.PropertyAdminService;
import co.ke.mkeja.onboarding.service.PropertyService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/api/v1/admin/properties")
@RequiredArgsConstructor
public class AdminPropertyController {

    private final PropertyService propertyService;
    private final PropertyAdminService propertyAdminService;

    @GetMapping
    public List<PropertyResponse> listAll(@RequestParam(required = false) String status) {
        return propertyService.listAllForAdmin(status);
    }

    @GetMapping("/pending")
    public List<PropertyResponse> listPending() {
        return propertyService.listPendingVerification();
    }

    @PostMapping("/{propertyId}/verify")
    public PropertyResponse verifyProperty(@PathVariable Long propertyId,
                                           @AuthenticationPrincipal User admin) {
        return propertyService.verifyProperty(propertyId, admin);
    }

    @PostMapping("/{propertyId}/reject")
    public PropertyResponse rejectProperty(@PathVariable Long propertyId,
                                           @AuthenticationPrincipal User admin) {
        return propertyService.rejectProperty(propertyId, admin);
    }

    @DeleteMapping("/{propertyId}")
    public void deleteProperty(@PathVariable Long propertyId,
                               @AuthenticationPrincipal User admin) {
        if (admin == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Not authenticated");
        }
        propertyAdminService.deletePropertyCompletely(propertyId);
    }

    @GetMapping("/{propertyId}")
    public AdminPropertyDetailResponse getProperty(@PathVariable Long propertyId) {
        return propertyService.getPropertyForAdmin(propertyId);
    }

    @GetMapping("/{propertyId}/vacant-units")
    public List<UnitResponse> listVacantUnits(@PathVariable Long propertyId) {
        return propertyService.listVacantUnitsForAdmin(propertyId);
    }
}

package co.ke.mkeja.onboarding.controller;

import co.ke.mkeja.onboarding.dto.response.LandlordInvitationSummaryResponse;
import co.ke.mkeja.onboarding.dto.response.LandlordTenantSummaryResponse;
import co.ke.mkeja.onboarding.dto.response.TenantLookupResponse;
import co.ke.mkeja.onboarding.dto.response.UnitHistoryResponse;
import co.ke.mkeja.onboarding.model.entity.User;
import co.ke.mkeja.onboarding.service.InvitationService;
import co.ke.mkeja.onboarding.service.LandlordService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/landlord")
@RequiredArgsConstructor
public class LandlordController {

    private final LandlordService landlordService;
    private final InvitationService invitationService;

    @GetMapping("/tenants")
    public List<LandlordTenantSummaryResponse> listTenants(
            @AuthenticationPrincipal User landlord,
            @RequestParam(required = false) Long propertyId,
            @RequestParam(required = false) Integer floor,
            @RequestParam(required = false) String search) {
        return landlordService.listTenants(landlord, propertyId, floor, search);
    }

    @GetMapping("/tenants/{tenantId}")
    public LandlordTenantSummaryResponse getTenant(
            @AuthenticationPrincipal User landlord,
            @PathVariable Long tenantId) {
        return landlordService.getTenantDetail(landlord, tenantId);
    }

    @GetMapping("/invitations")
    public List<LandlordInvitationSummaryResponse> listInvitations(
            @AuthenticationPrincipal User landlord,
            @RequestParam(required = false) Long propertyId,
            @RequestParam(required = false) Integer floor,
            @RequestParam(required = false) String search) {
        return landlordService.listPendingInvitations(landlord, propertyId, floor, search);
    }

    @GetMapping("/units/{unitId}/history")
    public UnitHistoryResponse unitHistory(
            @AuthenticationPrincipal User landlord,
            @PathVariable Long unitId) {
        return landlordService.getUnitHistory(landlord, unitId);
    }

    @GetMapping("/tenant-lookup")
    public TenantLookupResponse lookupTenant(@RequestParam String phone) {
        return invitationService.lookupTenantByPhone(phone);
    }
}

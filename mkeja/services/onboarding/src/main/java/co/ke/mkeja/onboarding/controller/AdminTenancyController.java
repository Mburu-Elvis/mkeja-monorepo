package co.ke.mkeja.onboarding.controller;

import co.ke.mkeja.onboarding.dto.request.AdminReassignTenancyRequest;
import co.ke.mkeja.onboarding.dto.response.AdminTenancyDetailResponse;
import co.ke.mkeja.onboarding.model.entity.User;
import co.ke.mkeja.onboarding.service.AdminTenancyService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/admin/tenancies")
@RequiredArgsConstructor
public class AdminTenancyController {

    private final AdminTenancyService adminTenancyService;

    @GetMapping
    public List<AdminTenancyDetailResponse> listTenancies(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String search) {
        return adminTenancyService.listTenancies(status, search);
    }

    @GetMapping("/{tenancyId}")
    public AdminTenancyDetailResponse getTenancy(@PathVariable Long tenancyId) {
        return adminTenancyService.getTenancy(tenancyId);
    }

    @PostMapping("/{tenancyId}/terminate")
    public AdminTenancyDetailResponse terminateTenancy(@PathVariable Long tenancyId,
                                                       @AuthenticationPrincipal User admin) {
        return adminTenancyService.terminateTenancy(tenancyId, admin);
    }

    @PatchMapping("/{tenancyId}/reassign")
    public AdminTenancyDetailResponse reassignTenancy(@PathVariable Long tenancyId,
                                                      @RequestBody AdminReassignTenancyRequest request,
                                                      @AuthenticationPrincipal User admin) {
        return adminTenancyService.reassignTenancy(tenancyId, request, admin);
    }
}

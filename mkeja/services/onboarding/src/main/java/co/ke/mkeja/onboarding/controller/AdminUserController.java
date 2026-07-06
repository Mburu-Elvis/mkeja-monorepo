package co.ke.mkeja.onboarding.controller;

import co.ke.mkeja.onboarding.dto.request.AdminUserUpdateRequest;
import co.ke.mkeja.onboarding.dto.response.AdminUserDetailResponse;
import co.ke.mkeja.onboarding.dto.response.AdminUserSummaryResponse;
import co.ke.mkeja.onboarding.service.AdminUserService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/admin/users")
@RequiredArgsConstructor
public class AdminUserController {

    private final AdminUserService adminUserService;

    @GetMapping
    public List<AdminUserSummaryResponse> listUsers(
            @RequestParam(required = false) String role,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String kycStatus) {
        return adminUserService.listUsers(role, status, search, kycStatus);
    }

    @GetMapping("/{id}")
    public AdminUserDetailResponse getUser(@PathVariable Long id) {
        return adminUserService.getUser(id);
    }

    @PatchMapping("/{id}")
    public AdminUserDetailResponse updateUser(@PathVariable Long id,
                                              @RequestBody AdminUserUpdateRequest request) {
        return adminUserService.updateUser(id, request);
    }

    @PostMapping("/{id}/toggle-status")
    public AdminUserDetailResponse toggleStatus(@PathVariable Long id) {
        return adminUserService.toggleUserStatus(id);
    }
}

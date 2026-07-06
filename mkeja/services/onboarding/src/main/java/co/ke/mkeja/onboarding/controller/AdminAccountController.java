package co.ke.mkeja.onboarding.controller;

import co.ke.mkeja.onboarding.dto.request.CreateAdminRequest;
import co.ke.mkeja.onboarding.dto.response.AdminAccountResponse;
import co.ke.mkeja.onboarding.exception.BadRequestException;
import co.ke.mkeja.onboarding.model.entity.User;
import co.ke.mkeja.onboarding.service.AdminAccountService;
import co.ke.mkeja.onboarding.service.RoleService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/admin/admins")
@RequiredArgsConstructor
public class AdminAccountController {

    private final AdminAccountService adminAccountService;
    private final RoleService roleService;

    @GetMapping
    public List<AdminAccountResponse> listAdmins(@AuthenticationPrincipal User user) {
        requireSuperAdmin(user);
        return adminAccountService.listAdmins();
    }

    @PostMapping
    public AdminAccountResponse createAdmin(@AuthenticationPrincipal User user,
                                            @Valid @RequestBody CreateAdminRequest request) {
        requireSuperAdmin(user);
        return adminAccountService.createAdmin(request, user);
    }

    private void requireSuperAdmin(User user) {
        if (user == null || !roleService.isSuperAdmin(user)) {
            throw new BadRequestException("Super admin access required");
        }
    }
}

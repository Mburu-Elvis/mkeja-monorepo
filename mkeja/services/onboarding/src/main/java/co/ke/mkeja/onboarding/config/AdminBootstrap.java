package co.ke.mkeja.onboarding.config;

import co.ke.mkeja.onboarding.model.entity.User;
import co.ke.mkeja.onboarding.model.enums.RoleName;
import co.ke.mkeja.onboarding.repository.UserRepository;
import co.ke.mkeja.onboarding.service.RoleService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

@Slf4j
@Component
@RequiredArgsConstructor
public class AdminBootstrap implements ApplicationRunner {

    private static final String ADMIN_PHONE = "254799999999";

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final RoleService roleService;

    @Override
    public void run(ApplicationArguments args) {
        userRepository.findByPhone(ADMIN_PHONE).ifPresentOrElse(
                this::ensureSuperAdmin,
                this::createBootstrapAdmin);
    }

    private void createBootstrapAdmin() {
        User admin = new User();
        admin.setPhone(ADMIN_PHONE);
        admin.setEmail("admin@mkeja.co.ke");
        admin.setFirstName("Platform");
        admin.setLastName("Admin");
        admin.setPasswordHash(passwordEncoder.encode("0000"));
        admin.setPasswordChangedAt(LocalDateTime.now());
        admin.setOtpVerified(true);
        admin.setCreatedBy("bootstrap");
        admin.setUpdatedBy("bootstrap");
        roleService.grantRole(admin, RoleName.SUPER_ADMIN, "bootstrap");
        roleService.grantRole(admin, RoleName.ADMIN, "bootstrap");

        userRepository.save(admin);
        log.info("Seeded default super admin with phone {}", ADMIN_PHONE);
    }

    private void ensureSuperAdmin(User admin) {
        boolean updated = false;
        if (!admin.isOtpVerified()) {
            admin.setOtpVerified(true);
            updated = true;
        }
        if (admin.getEmail() == null || admin.getEmail().isBlank()) {
            admin.setEmail("admin@mkeja.co.ke");
            updated = true;
        }
        if (!roleService.isSuperAdmin(admin)) {
            roleService.grantRole(admin, RoleName.SUPER_ADMIN, "bootstrap");
            updated = true;
        }
        if (!roleService.isAdmin(admin)) {
            roleService.grantRole(admin, RoleName.ADMIN, "bootstrap");
            updated = true;
        }
        if (updated) {
            userRepository.save(admin);
            log.info("Upgraded existing bootstrap admin to super admin");
        }
    }
}

package co.ke.mkeja.onboarding.service;

import co.ke.mkeja.onboarding.dto.response.AdminDashboardResponse;
import co.ke.mkeja.onboarding.dto.response.KycApplicationResponse;
import co.ke.mkeja.onboarding.dto.response.PropertyResponse;
import co.ke.mkeja.onboarding.model.enums.RoleName;
import co.ke.mkeja.onboarding.model.enums.TenancyStatus;
import co.ke.mkeja.onboarding.repository.TenancyRepository;
import co.ke.mkeja.onboarding.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class AdminDashboardService {

    private final UserRepository userRepository;
    private final TenancyRepository tenancyRepository;
    private final KycAdminService kycAdminService;
    private final PropertyService propertyService;
    private final AdminMetricsService adminMetricsService;
    private final RoleService roleService;

    @Transactional(readOnly = true)
    public AdminDashboardResponse getDashboard() {
        List<KycApplicationResponse> kycApps = kycAdminService.listApplications();
        long kycPending = kycApps.stream().filter(a -> "pending".equals(a.getStatus())).count();
        long kycManualReview = kycApps.stream().filter(a -> "manual_review".equals(a.getStatus())).count();
        long kycRejected = kycApps.stream().filter(a -> "rejected".equals(a.getStatus())).count();

        List<PropertyResponse> pendingProperties = propertyService.listPendingVerification();
        List<KycApplicationResponse> recentKyc = kycApps.stream().limit(5).toList();
        List<PropertyResponse> recentProperties = pendingProperties.stream().limit(5).toList();

        return AdminDashboardResponse.builder()
                .totalUsers(userRepository.count())
                .totalLandlords(roleService.countUsersWithRole(RoleName.PROPERTY_OWNER))
                .totalTenants(roleService.countUsersWithRole(RoleName.TENANT))
                .kycPending(kycPending)
                .kycManualReview(kycManualReview)
                .kycRejected(kycRejected)
                .propertiesPendingVerification(pendingProperties.size())
                .activeTenancies(tenancyRepository.countByStatus(TenancyStatus.ACTIVE))
                .apiStatus("UP")
                .recentKycApplications(recentKyc)
                .pendingProperties(recentProperties)
                .financial(adminMetricsService.computeFinancialMetrics())
                .business(adminMetricsService.computeBusinessMetrics())
                .operational(adminMetricsService.computeOperationalMetrics())
                .growth(adminMetricsService.computeGrowthTrend(6))
                .build();
    }
}

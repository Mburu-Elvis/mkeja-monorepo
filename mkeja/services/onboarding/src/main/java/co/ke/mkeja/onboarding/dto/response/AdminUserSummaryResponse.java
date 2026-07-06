package co.ke.mkeja.onboarding.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class AdminUserSummaryResponse {
    private String id;
    private String fullName;
    private String phone;
    private String email;
    private String role;
    private String status;
    private String kycStatus;
    private LocalDateTime joinedDate;
    private LocalDateTime lastLoginAt;
    private Integer propertyCount;
    private Integer tenantCount;
    private Integer tenancyCount;
}

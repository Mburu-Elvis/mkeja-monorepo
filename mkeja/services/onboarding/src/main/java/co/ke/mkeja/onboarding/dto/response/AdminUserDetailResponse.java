package co.ke.mkeja.onboarding.dto.response;

import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.experimental.SuperBuilder;

import java.util.List;

@Data
@SuperBuilder
@EqualsAndHashCode(callSuper = true)
public class AdminUserDetailResponse extends UserProfileResponse {
    private List<AdminPropertySummaryResponse> properties;
    private List<AdminTenancySummaryResponse> tenancies;
}

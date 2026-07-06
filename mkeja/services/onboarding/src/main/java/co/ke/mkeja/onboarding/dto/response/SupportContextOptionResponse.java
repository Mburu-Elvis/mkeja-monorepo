package co.ke.mkeja.onboarding.dto.response;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class SupportContextOptionResponse {
    private List<SupportTenancyOption> tenancies;
    private List<SupportPropertyOption> properties;
}

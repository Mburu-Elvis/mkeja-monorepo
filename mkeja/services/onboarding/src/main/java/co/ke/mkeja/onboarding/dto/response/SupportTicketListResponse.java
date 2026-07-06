package co.ke.mkeja.onboarding.dto.response;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class SupportTicketListResponse {
    private List<SupportTicketResponse> tickets;
}

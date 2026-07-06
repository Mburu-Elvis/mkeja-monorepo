package co.ke.mkeja.onboarding.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class SupportTicketMessageResponse {
    private Long id;
    private String message;
    private boolean fromUser;
    private String authorName;
    private LocalDateTime createdAt;
}

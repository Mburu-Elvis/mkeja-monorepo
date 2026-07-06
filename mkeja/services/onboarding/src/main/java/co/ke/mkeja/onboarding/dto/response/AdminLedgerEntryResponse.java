package co.ke.mkeja.onboarding.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class AdminLedgerEntryResponse {
    private String id;
    private LocalDateTime timestamp;
    private String type;
    private double amount;
    private String direction;
    private String tenantName;
    private String reference;
    private String status;
    private String source;
}

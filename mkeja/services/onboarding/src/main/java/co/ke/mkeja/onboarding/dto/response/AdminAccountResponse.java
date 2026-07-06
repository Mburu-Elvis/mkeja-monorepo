package co.ke.mkeja.onboarding.dto.response;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class AdminAccountResponse {
    private String id;
    private String fullName;
    private String phone;
    private String email;
    private String role;
    private String status;
    private String createdAt;
}

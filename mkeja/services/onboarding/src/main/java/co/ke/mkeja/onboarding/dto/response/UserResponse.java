package co.ke.mkeja.onboarding.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class UserResponse {
    private String id;
    private String fullName;
    private String phone;
    private String email;
    private String role;
    private String kycStatus;
    private LocalDateTime createdAt;
}

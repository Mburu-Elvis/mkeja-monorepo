package co.ke.mkeja.onboarding.dto.response;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class AuthResponse {
    private boolean otpRequired;
    private String challengeId;
    private String maskedPhone;
    private Integer otpExpiresInSeconds;
    private String access_token;
    private String refresh_token;
    private String token_type;
    private Long expires_in;
    private UserResponse user;
}

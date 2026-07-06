package co.ke.mkeja.onboarding.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.Map;

@Data
@Builder
public class KycApplicationResponse {
    private String id;
    private String fullName;
    private String idNumber;
    private String idType;
    private String phone;
    private String email;
    private String kraPin;
    private String companyName;
    private String licenseNumber;
    private String landlordName;
    private String unitRef;
    private LocalDateTime submittedAt;
    private String status;
    private String applicantType;
    private Map<String, String> documents;
}

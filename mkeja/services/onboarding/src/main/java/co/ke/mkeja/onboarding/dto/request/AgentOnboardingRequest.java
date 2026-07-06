package co.ke.mkeja.onboarding.dto.request;

import lombok.Data;

import java.util.Map;

@Data
public class AgentOnboardingRequest {
    private String userType;
    private String fullName;
    private String email;
    private String phone;
    private String idNumber;
    private String kraPin;
    private String companyName;
    private String regNumber;
    private String licenseNumber;
    private String physicalAddress;
    private String city;
    private String county;
    private String website;
    private boolean terms;
    private Map<String, String> docs;
    private String pin;
}

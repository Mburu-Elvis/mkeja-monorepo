package co.ke.mkeja.onboarding.dto.request;

import lombok.Data;

import java.util.List;
import java.util.Map;

@Data
public class LandlordOnboardingRequest {
    private String userType;
    private String fullName;
    private String email;
    private String phone;
    private String idNumber;
    private String kraPin;
    private String companyName;
    private String regNumber;
    private String saccoName;
    private String saccoLic;
    private List<StakeholderRequest> directors;
    private List<StakeholderRequest> owners;
    private List<StakeholderRequest> trustees;
    private String bankName;
    private String bankAccNum;
    private String bankCode;
    private String bankBranch;
    private boolean terms;
    private Map<String, String> docs;
    private String pin;
}

package co.ke.mkeja.onboarding.dto.request;

import lombok.Data;

@Data
public class UpdateHouseHuntRequest {
    private Boolean houseHuntEnabled;
    private Boolean autoRecommendEnabled;
}

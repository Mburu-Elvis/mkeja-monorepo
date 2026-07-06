package co.ke.mkeja.onboarding.dto.request;

import lombok.Data;

import java.time.LocalDate;

@Data
public class UpdateUnitListingRequest {
    private Boolean discoverable;
    private Boolean autoRecommend;
    private Boolean promoted;
    private String listingDescription;
    private LocalDate availableFrom;
}

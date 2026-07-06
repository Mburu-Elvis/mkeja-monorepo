package co.ke.mkeja.discovery.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDate;

@Data
@Builder
public class TenantPreferenceResponse {
    private Double minRent;
    private Double maxRent;
    private String preferredCounty;
    private String preferredCity;
    private Integer minBedrooms;
    private LocalDate moveByDate;
}

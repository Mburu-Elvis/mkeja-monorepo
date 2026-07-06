package co.ke.mkeja.discovery.dto;

import lombok.Data;

import java.time.LocalDate;

@Data
public class TenantPreferenceRequest {
    private Double minRent;
    private Double maxRent;
    private String preferredCounty;
    private String preferredCity;
    private Integer minBedrooms;
    private LocalDate moveByDate;
}

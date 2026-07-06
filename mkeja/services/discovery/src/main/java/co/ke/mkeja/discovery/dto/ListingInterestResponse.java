package co.ke.mkeja.discovery.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class ListingInterestResponse {
    private Long id;
    private Long unitId;
    private Long propertyId;
    private String tenantName;
    private String tenantPhone;
    private String unitLabel;
    private String propertyName;
    private Double monthlyRent;
    private String status;
    private String message;
    private LocalDateTime createdAt;
}

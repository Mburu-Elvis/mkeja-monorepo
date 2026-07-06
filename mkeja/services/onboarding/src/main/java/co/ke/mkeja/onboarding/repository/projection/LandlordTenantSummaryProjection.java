package co.ke.mkeja.onboarding.repository.projection;

import java.time.LocalDate;

public interface LandlordTenantSummaryProjection {
    Long getTenancyId();

    Long getTenantId();

    String getTenantName();

    String getTenantPhone();

    String getKycStatus();

    String getTenancyStatus();

    Long getPropertyId();

    String getPropertyName();

    String getUnitNumber();

    Long getUnitId();

    Integer getFloorNumber();

    String getWing();

    Double getMonthlyRent();

    Integer getRentDueDay();

    LocalDate getLeaseStartDate();

    LocalDate getLeaseEndDate();

    String getSource();
}

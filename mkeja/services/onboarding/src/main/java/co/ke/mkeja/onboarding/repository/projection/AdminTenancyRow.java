package co.ke.mkeja.onboarding.repository.projection;

import java.time.LocalDate;

public interface AdminTenancyRow {
    Long getId();

    Long getTenantId();

    Long getTenantUserId();

    String getTenantName();

    String getTenantPhone();

    Long getUnitId();

    String getUnitNumber();

    Long getPropertyId();

    String getPropertyName();

    String getLandlordName();

    String getStatus();

    Double getMonthlyRent();

    LocalDate getMoveInDate();

    LocalDate getMoveOutDate();

    LocalDate getLeaseStartDate();

    LocalDate getLeaseEndDate();

    Long getLeaseId();
}

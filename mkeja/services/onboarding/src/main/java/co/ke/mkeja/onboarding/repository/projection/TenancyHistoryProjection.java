package co.ke.mkeja.onboarding.repository.projection;

import java.time.LocalDate;

public interface TenancyHistoryProjection {
    Long getTenancyId();

    Long getTenantId();

    String getTenantName();

    String getTenantPhone();

    String getStatus();

    LocalDate getLeaseStartDate();

    LocalDate getLeaseEndDate();

    LocalDate getMoveInDate();

    LocalDate getMoveOutDate();

    Double getMonthlyRent();

    Integer getRentDueDay();
}

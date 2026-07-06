package co.ke.mkeja.onboarding.repository.projection;

import java.time.LocalDate;
import java.time.LocalDateTime;

public interface TenantInvitationRow {
    String getCode();

    String getStatus();

    String getLandlordName();

    String getPropertyName();

    String getUnitNumber();

    Long getUnitId();

    Long getPropertyId();

    Double getMonthlyRent();

    LocalDate getLeaseStartDate();

    LocalDateTime getExpiresAt();
}

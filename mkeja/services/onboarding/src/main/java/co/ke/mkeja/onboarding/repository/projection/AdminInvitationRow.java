package co.ke.mkeja.onboarding.repository.projection;

import java.time.LocalDate;
import java.time.LocalDateTime;

public interface AdminInvitationRow {
    Long getId();

    String getCode();

    String getStatus();

    String getTenantName();

    String getTenantPhone();

    String getLandlordName();

    Long getLandlordUserId();

    String getPropertyName();

    Long getPropertyId();

    String getUnitNumber();

    Long getUnitId();

    Double getMonthlyRent();

    LocalDate getLeaseStartDate();

    LocalDateTime getExpiresAt();

    LocalDateTime getCreatedAt();
}

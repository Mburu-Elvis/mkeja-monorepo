package co.ke.mkeja.onboarding.repository.projection;

public interface TenantProfileProjection {
    Long getTenantId();

    String getFullName();

    String getPhone();

    String getKycStatus();

    String getUnitNumber();

    Double getMonthlyRent();
}

package co.ke.mkeja.onboarding.repository;

import co.ke.mkeja.onboarding.model.entity.PropertyUnit;
import co.ke.mkeja.onboarding.model.enums.UnitStatus;
import co.ke.mkeja.onboarding.model.enums.UnitType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface PropertyUnitRepository extends JpaRepository<PropertyUnit, Long> {
    List<PropertyUnit> findByPropertyId(Long propertyId);

    List<PropertyUnit> findByPropertyIdAndStatus(Long propertyId, UnitStatus status);

    @Query("""
            SELECT DISTINCT u.unitType FROM PropertyUnit u
            WHERE u.property.id = :propertyId
              AND u.unitType IS NOT NULL
              AND u.deletedAt IS NULL
            """)
    List<UnitType> findDistinctUnitTypesByPropertyId(@Param("propertyId") Long propertyId);

    @Query("""
            SELECT u FROM PropertyUnit u
            WHERE u.property.owner.user.id = :landlordUserId
              AND u.status = co.ke.mkeja.onboarding.model.enums.UnitStatus.VACANT
            ORDER BY u.property.name, u.unitNumber
            """)
    List<PropertyUnit> findVacantUnitsForLandlord(@Param("landlordUserId") Long landlordUserId);
}

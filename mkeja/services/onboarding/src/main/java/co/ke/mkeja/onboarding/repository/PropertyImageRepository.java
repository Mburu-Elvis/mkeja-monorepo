package co.ke.mkeja.onboarding.repository;

import co.ke.mkeja.onboarding.model.entity.PropertyImage;
import co.ke.mkeja.onboarding.model.enums.UnitType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface PropertyImageRepository extends JpaRepository<PropertyImage, Long> {
    List<PropertyImage> findByPropertyIdAndDeletedAtIsNullOrderBySortOrderAsc(Long propertyId);

    List<PropertyImage> findByPropertyIdAndUnitIdAndDeletedAtIsNullOrderBySortOrderAsc(Long propertyId, Long unitId);

    List<PropertyImage> findByPropertyIdAndUnitIsNullAndUnitTypeIsNullAndDeletedAtIsNullOrderBySortOrderAsc(Long propertyId);

    List<PropertyImage> findByPropertyIdAndUnitIsNullAndUnitTypeAndDeletedAtIsNullOrderBySortOrderAsc(Long propertyId, UnitType unitType);

    List<PropertyImage> findByPropertyIdAndUnitTypeAndDeletedAtIsNullOrderBySortOrderAsc(Long propertyId, UnitType unitType);

    Optional<PropertyImage> findFirstByPropertyIdAndUnitIsNullAndUnitTypeIsNullAndDeletedAtIsNullOrderByPrimaryImageDescSortOrderAsc(
            Long propertyId);

    Optional<PropertyImage> findFirstByPropertyIdAndUnitIsNullAndUnitTypeAndDeletedAtIsNullOrderByPrimaryImageDescSortOrderAsc(
            Long propertyId, UnitType unitType);

    Optional<PropertyImage> findFirstByPropertyIdAndUnitTypeAndDeletedAtIsNullOrderByPrimaryImageDescSortOrderAsc(
            Long propertyId, UnitType unitType);

    Optional<PropertyImage> findFirstByPropertyIdAndUnitIdAndDeletedAtIsNullOrderByPrimaryImageDescSortOrderAsc(
            Long propertyId, Long unitId);

    @Query("""
            SELECT DISTINCT pi.unitType FROM PropertyImage pi
            WHERE pi.property.id = :propertyId
              AND pi.unit IS NULL
              AND pi.unitType IS NOT NULL
              AND pi.deletedAt IS NULL
            """)
    List<UnitType> findDistinctSampleUnitTypesByPropertyId(@Param("propertyId") Long propertyId);
}

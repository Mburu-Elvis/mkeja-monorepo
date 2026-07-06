package co.ke.mkeja.onboarding.repository;

import co.ke.mkeja.onboarding.model.entity.Property;
import co.ke.mkeja.onboarding.model.enums.PropertyStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface PropertyRepository extends JpaRepository<Property, Long> {
    List<Property> findByOwnerId(Long ownerId);

    List<Property> findByOwnerIdAndDeletedAtIsNull(Long ownerId);

    List<Property> findByPropertyStatus(PropertyStatus propertyStatus);

    List<Property> findByPropertyStatusAndDeletedAtIsNull(PropertyStatus propertyStatus);

    List<Property> findAllByDeletedAtIsNull();

    @Query("SELECT p FROM Property p WHERE p.owner.user.id = :userId AND p.deletedAt IS NULL")
    List<Property> findByOwnerUserId(@Param("userId") Long userId);

    @Query("""
            SELECT p FROM Property p
            WHERE p.id = :propertyId AND p.owner.user.id = :userId AND p.deletedAt IS NULL
            """)
    java.util.Optional<Property> findByIdAndOwnerUserId(@Param("propertyId") Long propertyId, @Param("userId") Long userId);

    @Query("""
            SELECT p FROM Property p
            WHERE p.agent.user.id = :userId AND p.deletedAt IS NULL
            ORDER BY p.name ASC
            """)
    List<Property> findByAgentUserId(@Param("userId") Long userId);

    @Query("""
            SELECT p FROM Property p
            WHERE p.id = :propertyId AND p.agent.user.id = :userId AND p.deletedAt IS NULL
            """)
    java.util.Optional<Property> findByIdAndAgentUserId(@Param("propertyId") Long propertyId, @Param("userId") Long userId);
}

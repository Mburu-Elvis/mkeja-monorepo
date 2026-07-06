package co.ke.mkeja.onboarding.repository;

import co.ke.mkeja.onboarding.model.entity.PropertyOwner;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface PropertyOwnerRepository extends JpaRepository<PropertyOwner, Long> {
    Optional<PropertyOwner> findByUserId(Long userId);
}

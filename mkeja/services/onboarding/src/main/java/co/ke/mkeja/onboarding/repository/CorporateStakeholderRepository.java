package co.ke.mkeja.onboarding.repository;

import co.ke.mkeja.onboarding.model.entity.CorporateStakeholder;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CorporateStakeholderRepository extends JpaRepository<CorporateStakeholder, Long> {
    List<CorporateStakeholder> findByPropertyOwnerId(Long propertyOwnerId);
}

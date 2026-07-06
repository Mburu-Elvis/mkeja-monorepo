package co.ke.mkeja.onboarding.repository;

import co.ke.mkeja.onboarding.model.entity.BankAccount;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface BankAccountRepository extends JpaRepository<BankAccount, Long> {
    Optional<BankAccount> findByPropertyOwnerId(Long propertyOwnerId);
}

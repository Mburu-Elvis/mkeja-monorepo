package co.ke.mkeja.onboarding.repository;

import co.ke.mkeja.onboarding.model.entity.User;
import co.ke.mkeja.onboarding.model.enums.UserType;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    @EntityGraph(attributePaths = "roles")
    Optional<User> findByPhone(String phone);

    @EntityGraph(attributePaths = "roles")
    Optional<User> findById(Long id);

    boolean existsByPhone(String phone);

    boolean existsByEmail(String email);

    long countByUserType(UserType userType);
}

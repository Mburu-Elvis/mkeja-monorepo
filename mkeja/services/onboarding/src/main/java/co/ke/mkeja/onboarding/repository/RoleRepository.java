package co.ke.mkeja.onboarding.repository;

import co.ke.mkeja.onboarding.model.entity.Role;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface RoleRepository extends JpaRepository<Role, Long> {

    @Query("""
            SELECT COUNT(DISTINCT r.user.id) FROM Role r
            WHERE r.name = :roleName AND r.isActive = true
            AND (r.expiresAt IS NULL OR r.expiresAt > CURRENT_TIMESTAMP)
            """)
    long countDistinctUsersByRoleName(@Param("roleName") String roleName);
}

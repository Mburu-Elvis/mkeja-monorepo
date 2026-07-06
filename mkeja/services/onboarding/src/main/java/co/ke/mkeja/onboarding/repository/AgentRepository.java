package co.ke.mkeja.onboarding.repository;

import co.ke.mkeja.onboarding.model.entity.Agent;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface AgentRepository extends JpaRepository<Agent, Long> {
    Optional<Agent> findByUserId(Long userId);
}

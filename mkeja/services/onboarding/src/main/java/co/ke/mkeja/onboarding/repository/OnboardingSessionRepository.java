package co.ke.mkeja.onboarding.repository;

import co.ke.mkeja.onboarding.model.entity.OnboardingSession;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface OnboardingSessionRepository extends JpaRepository<OnboardingSession, Long> {
    Optional<OnboardingSession> findByInvitationCode(String invitationCode);
    Optional<OnboardingSession> findByUserId(Long userId);
}

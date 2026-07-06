package co.ke.mkeja.onboarding.repository;

import co.ke.mkeja.onboarding.model.entity.OtpChallenge;
import co.ke.mkeja.onboarding.model.enums.OtpPurpose;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface OtpChallengeRepository extends JpaRepository<OtpChallenge, String> {

    Optional<OtpChallenge> findByIdAndPhoneAndConsumedFalse(String id, String phone);

    Optional<OtpChallenge> findTopByUserIdAndPurposeAndConsumedFalseOrderByCreatedAtDesc(
            Long userId, OtpPurpose purpose);
}

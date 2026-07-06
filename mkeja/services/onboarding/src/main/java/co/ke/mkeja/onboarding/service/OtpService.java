package co.ke.mkeja.onboarding.service;

import co.ke.mkeja.onboarding.dto.response.AuthResponse;
import co.ke.mkeja.onboarding.exception.BadRequestException;
import co.ke.mkeja.onboarding.model.entity.OtpChallenge;
import co.ke.mkeja.onboarding.model.entity.User;
import co.ke.mkeja.onboarding.model.enums.OtpPurpose;
import co.ke.mkeja.onboarding.repository.OtpChallengeRepository;
import co.ke.mkeja.onboarding.repository.UserRepository;
import co.ke.mkeja.onboarding.util.UserFieldNormalizer;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class OtpService {

    private static final int OTP_EXPIRY_MINUTES = 10;
    private static final int MAX_ATTEMPTS = 5;

    private final OtpChallengeRepository otpChallengeRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final SecureRandom secureRandom = new SecureRandom();

    @Transactional
    public AuthResponse issueFirstLoginChallenge(User user) {
        OtpChallenge challenge = createChallenge(user, OtpPurpose.FIRST_LOGIN);
        return buildOtpRequiredResponse(user, challenge);
    }

    @Transactional
    public User verifyFirstLoginOtp(String challengeId, String phone, String otp) {
        String normalizedPhone = UserFieldNormalizer.normalizePhone(phone);
        OtpChallenge challenge = otpChallengeRepository
                .findByIdAndPhoneAndConsumedFalse(challengeId, normalizedPhone)
                .orElseThrow(() -> new BadRequestException("Invalid or expired verification code"));

        if (challenge.getExpiresAt().isBefore(LocalDateTime.now())) {
            challenge.setConsumed(true);
            otpChallengeRepository.save(challenge);
            throw new BadRequestException("Verification code has expired");
        }

        if (challenge.getAttemptCount() >= MAX_ATTEMPTS) {
            challenge.setConsumed(true);
            otpChallengeRepository.save(challenge);
            throw new BadRequestException("Too many failed attempts. Request a new code.");
        }

        if (!passwordEncoder.matches(otp, challenge.getOtpHash())) {
            challenge.setAttemptCount(challenge.getAttemptCount() + 1);
            otpChallengeRepository.save(challenge);
            throw new BadRequestException("Invalid verification code");
        }

        challenge.setConsumed(true);
        otpChallengeRepository.save(challenge);

        return userRepository.findById(challenge.getUserId())
                .orElseThrow(() -> new BadRequestException("User not found"));
    }

    @Transactional
    public AuthResponse resendChallenge(String challengeId, String phone) {
        String normalizedPhone = UserFieldNormalizer.normalizePhone(phone);
        OtpChallenge existing = otpChallengeRepository
                .findByIdAndPhoneAndConsumedFalse(challengeId, normalizedPhone)
                .orElseThrow(() -> new BadRequestException("Verification session not found"));

        User user = userRepository.findById(existing.getUserId())
                .orElseThrow(() -> new BadRequestException("User not found"));

        existing.setConsumed(true);
        otpChallengeRepository.save(existing);

        OtpChallenge challenge = createChallenge(user, existing.getPurpose());
        return buildOtpRequiredResponse(user, challenge);
    }

    private OtpChallenge createChallenge(User user, OtpPurpose purpose) {
        String otp = generateOtp();

        OtpChallenge challenge = new OtpChallenge();
        challenge.setId(UUID.randomUUID().toString());
        challenge.setUserId(user.getId());
        challenge.setPhone(user.getPhone());
        challenge.setOtpHash(passwordEncoder.encode(otp));
        challenge.setPurpose(purpose);
        challenge.setExpiresAt(LocalDateTime.now().plusMinutes(OTP_EXPIRY_MINUTES));
        challenge.setConsumed(false);
        challenge.setAttemptCount(0);
        challenge.setCreatedAt(LocalDateTime.now());
        otpChallengeRepository.save(challenge);

        deliverOtp(user, otp, purpose);
        return challenge;
    }

    private void deliverOtp(User user, String otp, OtpPurpose purpose) {
        log.info("OTP stub: send code {} to phone {} for purpose {}", otp, user.getPhone(), purpose);
        if (user.getEmail() != null && !user.getEmail().isBlank()) {
            log.info("OTP email stub: send code {} to {}", otp, user.getEmail());
        }
    }

    private AuthResponse buildOtpRequiredResponse(User user, OtpChallenge challenge) {
        return AuthResponse.builder()
                .otpRequired(true)
                .challengeId(challenge.getId())
                .maskedPhone(maskPhone(user.getPhone()))
                .otpExpiresInSeconds(OTP_EXPIRY_MINUTES * 60)
                .build();
    }

    private String generateOtp() {
        int value = secureRandom.nextInt(1_000_000);
        return String.format("%06d", value);
    }

    private String maskPhone(String phone) {
        if (phone == null || phone.length() < 4) {
            return "****";
        }
        return phone.substring(0, Math.min(3, phone.length())) + "****" + phone.substring(phone.length() - 2);
    }
}

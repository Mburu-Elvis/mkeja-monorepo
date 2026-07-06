package co.ke.mkeja.onboarding.service;

import co.ke.mkeja.onboarding.dto.request.AgentOnboardingRequest;
import co.ke.mkeja.onboarding.dto.response.LandlordOnboardingResponse;
import co.ke.mkeja.onboarding.event.EventPublisher;
import co.ke.mkeja.onboarding.event.OnboardingEvent;
import co.ke.mkeja.onboarding.event.OnboardingEventType;
import co.ke.mkeja.onboarding.exception.BadRequestException;
import co.ke.mkeja.onboarding.mapper.EntityMapper;
import co.ke.mkeja.onboarding.model.entity.Agent;
import co.ke.mkeja.onboarding.model.entity.OnboardingSession;
import co.ke.mkeja.onboarding.model.entity.User;
import co.ke.mkeja.onboarding.model.enums.AgentType;
import co.ke.mkeja.onboarding.model.enums.KycStatus;
import co.ke.mkeja.onboarding.model.enums.RoleName;
import co.ke.mkeja.onboarding.repository.AgentRepository;
import co.ke.mkeja.onboarding.repository.OnboardingSessionRepository;
import co.ke.mkeja.onboarding.repository.UserRepository;
import co.ke.mkeja.onboarding.util.UserFieldNormalizer;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class AgentOnboardingService {

    private final UserRepository userRepository;
    private final AgentRepository agentRepository;
    private final OnboardingSessionRepository onboardingSessionRepository;
    private final PasswordEncoder passwordEncoder;
    private final KycService kycService;
    private final EventPublisher eventPublisher;
    private final RoleService roleService;

    @Transactional
    public LandlordOnboardingResponse submit(AgentOnboardingRequest request) throws IOException {
        if (!request.isTerms()) {
            throw new BadRequestException("Terms must be accepted");
        }

        String phone = UserFieldNormalizer.normalizePhone(request.getPhone());
        if (userRepository.existsByPhone(phone)) {
            throw new BadRequestException("Phone number already registered");
        }

        AgentType agentType = mapUserType(request.getUserType());
        User user = createUser(request, phone);
        Agent agent = createAgent(request, user, agentType);

        if (request.getDocs() != null && !request.getDocs().isEmpty()) {
            kycService.uploadAgentDocuments(agent.getId(), request.getDocs());
        }

        OnboardingSession session = new OnboardingSession();
        session.setUserId(user.getId());
        session.setSessionType("AGENT");
        session.setCurrentStep(4);
        session.setCompletedSteps("[1,2,3,4]");
        onboardingSessionRepository.save(session);

        eventPublisher.publish(OnboardingEvent.of(
                OnboardingEventType.AGENT_REGISTERED,
                String.valueOf(agent.getId()),
                Map.of("userId", user.getId(), "kycStatus", agent.getKycStatus().name())));

        return LandlordOnboardingResponse.builder()
                .applicationId(String.valueOf(agent.getId()))
                .kycStatus(EntityMapper.toFrontendKycStatus(agent.getKycStatus()))
                .message("Agent application submitted successfully")
                .build();
    }

    private User createUser(AgentOnboardingRequest request, String phone) {
        User user = new User();
        user.setPhone(phone);
        user.setEmail(UserFieldNormalizer.normalizeEmail(request.getEmail()));
        String[] parts = request.getFullName().trim().split("\\s+", 2);
        user.setFirstName(parts[0]);
        user.setLastName(parts.length > 1 ? parts[1] : "");
        String pin = request.getPin() != null ? request.getPin() : "1234";
        user.setPasswordHash(passwordEncoder.encode(pin));
        user.setPasswordChangedAt(LocalDateTime.now());
        user.setCreatedBy("onboarding");
        user.setUpdatedBy("onboarding");
        roleService.grantRole(user, RoleName.AGENT, "onboarding");
        return userRepository.save(user);
    }

    private Agent createAgent(AgentOnboardingRequest request, User user, AgentType agentType) {
        Agent agent = new Agent();
        agent.setUser(user);
        agent.setAgentType(agentType);
        agent.setNationalId(request.getIdNumber());
        agent.setKraPin(request.getKraPin());
        agent.setLicenseNumber(request.getLicenseNumber());
        agent.setCompanyName(request.getCompanyName());
        agent.setRegistrationNumber(request.getRegNumber());
        agent.setPhysicalAddress(request.getPhysicalAddress());
        agent.setCity(request.getCity());
        agent.setCounty(request.getCounty());
        agent.setWebsite(request.getWebsite());
        agent.setKycStatus(agentType == AgentType.INDIVIDUAL ? KycStatus.PENDING : KycStatus.MANUAL_REVIEW);
        return agentRepository.save(agent);
    }

    private AgentType mapUserType(String userType) {
        if ("COMPANY_AGENT".equals(userType)) {
            return AgentType.COMPANY;
        }
        return AgentType.INDIVIDUAL;
    }
}

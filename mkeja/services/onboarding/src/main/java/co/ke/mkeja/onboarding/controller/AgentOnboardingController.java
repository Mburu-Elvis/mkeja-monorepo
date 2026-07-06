package co.ke.mkeja.onboarding.controller;

import co.ke.mkeja.onboarding.dto.request.AgentOnboardingRequest;
import co.ke.mkeja.onboarding.dto.response.LandlordOnboardingResponse;
import co.ke.mkeja.onboarding.service.AgentOnboardingService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.io.IOException;

@RestController
@RequestMapping("/api/v1/onboarding/agents")
@RequiredArgsConstructor
public class AgentOnboardingController {

    private final AgentOnboardingService agentOnboardingService;

    @PostMapping
    public LandlordOnboardingResponse submit(@RequestBody AgentOnboardingRequest request) throws IOException {
        return agentOnboardingService.submit(request);
    }
}

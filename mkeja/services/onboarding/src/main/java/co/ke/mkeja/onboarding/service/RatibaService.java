package co.ke.mkeja.onboarding.service;

import co.ke.mkeja.onboarding.dto.request.RatibaSetupRequest;
import co.ke.mkeja.onboarding.dto.response.RatibaSetupResponse;
import co.ke.mkeja.onboarding.exception.BadRequestException;
import co.ke.mkeja.onboarding.exception.ResourceNotFoundException;
import co.ke.mkeja.onboarding.model.entity.StandingOrder;
import co.ke.mkeja.onboarding.model.entity.Tenancy;
import co.ke.mkeja.onboarding.model.entity.Tenant;
import co.ke.mkeja.onboarding.model.enums.PaymentPlan;
import co.ke.mkeja.onboarding.model.enums.StandingOrderStatus;
import co.ke.mkeja.onboarding.model.enums.TenancyStatus;
import co.ke.mkeja.onboarding.repository.StandingOrderRepository;
import co.ke.mkeja.onboarding.repository.TenancyRepository;
import co.ke.mkeja.onboarding.repository.TenantRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class RatibaService {

    private final StandingOrderRepository standingOrderRepository;
    private final TenantRepository tenantRepository;
    private final TenancyRepository tenancyRepository;

    @Transactional
    public RatibaSetupResponse setupRatiba(Long tenantId, RatibaSetupRequest request) {
        Tenant tenant = tenantRepository.findById(tenantId)
                .orElseThrow(() -> new ResourceNotFoundException("Tenant not found"));

        Tenancy tenancy = tenancyRepository.findByTenantId(tenantId)
                .orElseThrow(() -> new BadRequestException("Sign the lease before setting up payments"));

        if (tenancy.getStatus() != TenancyStatus.ACTIVE) {
            throw new BadRequestException("Active tenancy required before setting up payments");
        }

        PaymentPlan plan = PaymentPlan.valueOf(request.getPlan().toUpperCase());
        String scheduleId = "sch-" + System.currentTimeMillis();

        StandingOrder order = standingOrderRepository.findByTenantId(tenantId).orElseGet(StandingOrder::new);
        order.setTenant(tenant);
        order.setPlan(plan);
        order.setAmount(request.getAmount());
        order.setFrequency(plan == PaymentPlan.DAILY ? 2 : plan == PaymentPlan.WEEKLY ? 3 : 1);
        order.setStatus(StandingOrderStatus.ACTIVE);
        order.setScheduleId(scheduleId);
        order.setExternalRef("MPESA-STUB-" + scheduleId);
        standingOrderRepository.save(order);

        tenancy.setPaymentPlan(plan);
        tenancyRepository.save(tenancy);

        log.info("Ratiba standing order stub created: {} for tenant {}", scheduleId, tenantId);

        return RatibaSetupResponse.builder()
                .scheduleId(scheduleId)
                .status("ACTIVE")
                .build();
    }
}

package co.ke.mkeja.onboarding.service;

import co.ke.mkeja.onboarding.dto.response.SecurityDepositResponse;
import co.ke.mkeja.onboarding.exception.ResourceNotFoundException;
import co.ke.mkeja.onboarding.mapper.EntityMapper;
import co.ke.mkeja.onboarding.model.entity.SecurityDeposit;
import co.ke.mkeja.onboarding.model.entity.Tenant;
import co.ke.mkeja.onboarding.model.enums.KycStatus;
import co.ke.mkeja.onboarding.repository.SecurityDepositRepository;
import co.ke.mkeja.onboarding.repository.TenantRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class PaymentService {

    private final SecurityDepositRepository securityDepositRepository;
    private final TenantRepository tenantRepository;

    @Transactional
    public String initiateSecurityDeposit(Tenant tenant, Double amount) {
        SecurityDeposit deposit = securityDepositRepository.findByTenantId(tenant.getId())
                .orElseGet(SecurityDeposit::new);
        deposit.setTenant(tenant);
        deposit.setAmount(amount != null ? amount : 5000.0);
        deposit.setStkRef("STK-" + System.currentTimeMillis());
        deposit.setStatus(KycStatus.PENDING);
        securityDepositRepository.save(deposit);

        new Thread(() -> autoApproveDeposit(deposit.getId())).start();
        return deposit.getStkRef();
    }

    @Transactional
    public SecurityDepositResponse initiateDeposit(Long tenantId) {
        Tenant tenant = tenantRepository.findById(tenantId)
                .orElseThrow(() -> new ResourceNotFoundException("Tenant not found"));
        Double amount = tenant.getUnit() != null && tenant.getUnit().getDeposit() != null
                ? tenant.getUnit().getDeposit() : 5000.0;
        String stkRef = initiateSecurityDeposit(tenant, amount);
        return SecurityDepositResponse.builder()
                .stkRef(stkRef)
                .status("PENDING")
                .build();
    }

    @Transactional(readOnly = true)
    public SecurityDepositResponse getDepositStatus(Long tenantId) {
        SecurityDeposit deposit = securityDepositRepository.findByTenantId(tenantId)
                .orElseThrow(() -> new ResourceNotFoundException("Security deposit not found"));
        return SecurityDepositResponse.builder()
                .stkRef(deposit.getStkRef())
                .status(EntityMapper.toFrontendKycStatus(deposit.getStatus()))
                .build();
    }

    private void autoApproveDeposit(Long depositId) {
        try {
            Thread.sleep(3000);
            securityDepositRepository.findById(depositId).ifPresent(deposit -> {
                deposit.setStatus(KycStatus.APPROVED);
                securityDepositRepository.save(deposit);
                log.info("Security deposit auto-approved stub for deposit {}", depositId);
            });
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
    }
}

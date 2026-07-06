package co.ke.mkeja.onboarding.service;

import co.ke.mkeja.onboarding.dto.response.LeaseSummaryResponse;
import co.ke.mkeja.onboarding.dto.response.TenancyCreationResponse;
import co.ke.mkeja.onboarding.event.EventPublisher;
import co.ke.mkeja.onboarding.event.OnboardingEvent;
import co.ke.mkeja.onboarding.event.OnboardingEventType;
import co.ke.mkeja.onboarding.exception.BadRequestException;
import co.ke.mkeja.onboarding.exception.ResourceNotFoundException;
import co.ke.mkeja.onboarding.model.entity.*;
import co.ke.mkeja.onboarding.model.enums.*;
import co.ke.mkeja.onboarding.repository.*;
import co.ke.mkeja.onboarding.util.UserFieldNormalizer;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class TenancyCreationService {

    private final TenantRepository tenantRepository;
    private final TenantInvitationRepository invitationRepository;
    private final PropertyUnitRepository propertyUnitRepository;
    private final TenancyRepository tenancyRepository;
    private final LeaseRepository leaseRepository;
    private final OnboardingSessionRepository onboardingSessionRepository;
    private final EventPublisher eventPublisher;
    private final HouseHuntService houseHuntService;

    @Transactional(readOnly = true)
    public LeaseSummaryResponse getLeaseSummary(Long tenantId, String invitationCode) {
        tenantRepository.findById(tenantId)
                .orElseThrow(() -> new ResourceNotFoundException("Tenant not found"));
        TenantInvitation invitation = invitationRepository.findByCode(invitationCode)
                .orElseThrow(() -> new ResourceNotFoundException("Invitation not found"));
        PropertyUnit unit = invitation.getUnit();
        Property property = unit.getProperty();
        return LeaseSummaryResponse.builder()
                .landlordName(invitation.getLandlord().getFullName())
                .unitName(unit.getUnitNumber())
                .propertyAddress(property != null ? property.getAddress() : "")
                .monthlyRent(invitation.getMonthlyRent())
                .depositAmount(resolveDeposit(invitation, unit))
                .leaseStartDate(invitation.getLeaseStartDate())
                .leaseEndDate(invitation.getLeaseEndDate())
                .build();
    }

    @Transactional
    public TenancyCreationResponse signLeaseAndCreateTenancy(Long tenantId, String invitationCode) {
        Tenant tenant = tenantRepository.findById(tenantId)
                .orElseThrow(() -> new ResourceNotFoundException("Tenant not found"));
        TenantInvitation invitation = invitationRepository.findByCode(invitationCode)
                .orElseThrow(() -> new ResourceNotFoundException("Invitation not found"));
        return createTenancyFromInvitation(tenant, invitation);
    }

    @Transactional
    public TenancyCreationResponse createTenancyFromInvitation(Tenant tenant, TenantInvitation invitation) {
        validateInvitationForTenancy(invitation, tenant);

        PropertyUnit unit = invitation.getUnit();

        Lease lease = new Lease();
        lease.setTenant(tenant);
        lease.setUnit(unit);
        lease.setInvitation(invitation);
        lease.setStartDate(invitation.getLeaseStartDate());
        lease.setEndDate(invitation.getLeaseEndDate());
        lease.setMonthlyRent(invitation.getMonthlyRent());
        lease.setDepositAmount(resolveDeposit(invitation, unit));
        lease.setStatus(LeaseStatus.ACTIVE);
        lease.setSignedAt(LocalDateTime.now());
        lease = leaseRepository.save(lease);

        Tenancy tenancy = new Tenancy();
        tenancy.setTenant(tenant);
        tenancy.setUnit(unit);
        tenancy.setInvitation(invitation);
        tenancy.setLease(lease);
        tenancy.setMoveInDate(invitation.getLeaseStartDate() != null
                ? invitation.getLeaseStartDate() : LocalDate.now());
        tenancy.setLeaseStartDate(lease.getStartDate());
        tenancy.setLeaseEndDate(lease.getEndDate());
        tenancy.setMonthlyRent(invitation.getMonthlyRent());
        tenancy.setPaymentPlan(null);
        tenancy.setRentDueDay(invitation.getRentDueDay());
        tenancy.setStatus(TenancyStatus.ACTIVE);
        tenancy = tenancyRepository.save(tenancy);

        unit.setStatus(UnitStatus.OCCUPIED);
        unit.setTenant(tenant);
        propertyUnitRepository.save(unit);
        houseHuntService.syncUnitListing(unit.getProperty(), unit);

        invitation.setStatus(InvitationStatus.ACCEPTED);
        invitation.setAcceptedAt(LocalDateTime.now());
        invitationRepository.save(invitation);

        onboardingSessionRepository.findByUserId(tenant.getUser().getId()).ifPresent(session -> {
            session.setCurrentStep(6);
            session.setCompletedSteps("[1,2,3,4,5,6]");
            onboardingSessionRepository.save(session);
        });

        Long tenantId = tenant.getId();
        eventPublisher.publish(OnboardingEvent.of(
                OnboardingEventType.LEASE_SIGNED,
                String.valueOf(lease.getId()),
                Map.of("tenantId", tenantId, "unitId", unit.getId())));
        eventPublisher.publish(OnboardingEvent.of(
                OnboardingEventType.TENANCY_CREATED,
                String.valueOf(tenancy.getId()),
                Map.of("tenantId", tenantId, "unitId", unit.getId())));
        eventPublisher.publish(OnboardingEvent.of(
                OnboardingEventType.INVITATION_ACCEPTED,
                invitation.getCode(),
                Map.of("tenantId", tenantId)));

        return TenancyCreationResponse.builder()
                .tenancyId(String.valueOf(tenancy.getId()))
                .leaseId(String.valueOf(lease.getId()))
                .invitationCode(invitation.getCode())
                .message("Tenancy created successfully")
                .build();
    }

    private void validateInvitationForTenancy(TenantInvitation invitation, Tenant tenant) {
        if (invitation.getStatus() == InvitationStatus.EXPIRED
                || invitation.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new BadRequestException("Invitation has expired");
        }
        if (invitation.getStatus() == InvitationStatus.CANCELLED) {
            throw new BadRequestException("Invitation has been cancelled");
        }

        PropertyUnit unit = invitation.getUnit();
        if (unit.getStatus() != UnitStatus.VACANT) {
            throw new BadRequestException("Unit is no longer available");
        }

        if (tenant.getKycStatus() != KycStatus.APPROVED && tenant.getKycStatus() != KycStatus.VERIFIED) {
            throw new BadRequestException("Tenant KYC must be approved before creating a tenancy");
        }

        String tenantPhone = UserFieldNormalizer.normalizePhone(tenant.getUser().getPhone());
        if (!tenantPhone.equals(invitation.getTenantPhone())) {
            throw new BadRequestException("Invitation phone does not match tenant account");
        }

        tenancyRepository.findByUnitIdAndStatus(unit.getId(), TenancyStatus.ACTIVE)
                .ifPresent(t -> {
                    throw new BadRequestException("Unit already has an active tenancy");
                });
    }

    private Double resolveDeposit(TenantInvitation invitation, PropertyUnit unit) {
        if (invitation.getDepositAmount() != null) {
            return invitation.getDepositAmount();
        }
        if (unit.getDeposit() != null) {
            return unit.getDeposit();
        }
        return invitation.getMonthlyRent();
    }
}

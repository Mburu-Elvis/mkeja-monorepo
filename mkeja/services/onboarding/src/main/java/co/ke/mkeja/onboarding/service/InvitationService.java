package co.ke.mkeja.onboarding.service;

import co.ke.mkeja.onboarding.dto.request.CreateInvitationRequest;
import co.ke.mkeja.onboarding.dto.response.*;
import co.ke.mkeja.onboarding.event.EventPublisher;
import co.ke.mkeja.onboarding.event.OnboardingEvent;
import co.ke.mkeja.onboarding.event.OnboardingEventType;
import co.ke.mkeja.onboarding.exception.BadRequestException;
import co.ke.mkeja.onboarding.exception.ResourceNotFoundException;
import co.ke.mkeja.onboarding.model.entity.*;
import co.ke.mkeja.onboarding.model.enums.*;
import co.ke.mkeja.onboarding.repository.*;
import co.ke.mkeja.onboarding.repository.projection.TenantInvitationRow;
import co.ke.mkeja.onboarding.util.UserFieldNormalizer;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class InvitationService {

    private final TenantInvitationRepository invitationRepository;
    private final UserRepository userRepository;
    private final TenantRepository tenantRepository;
    private final TenancyCreationService tenancyCreationService;
    private final EventPublisher eventPublisher;
    private final AuthorizationService authorizationService;
    private final RoleService roleService;

    @Transactional(readOnly = true)
    public TenantLookupResponse lookupTenantByPhone(String phone) {
        String normalized = UserFieldNormalizer.normalizePhone(phone);
        Optional<User> userOpt = userRepository.findByPhone(normalized);
        if (userOpt.isEmpty()) {
            return TenantLookupResponse.builder()
                    .registered(false)
                    .phone(normalized)
                    .canLinkImmediately(false)
                    .message("New tenant — they'll register once via the invite link")
                    .build();
        }

        User user = userOpt.get();
        Optional<Tenant> tenantOpt = tenantRepository.findByUserId(user.getId());
        if (tenantOpt.isEmpty()) {
            return TenantLookupResponse.builder()
                    .registered(false)
                    .phone(normalized)
                    .fullName(user.getFullName())
                    .canLinkImmediately(false)
                    .message("Phone is registered but not as a tenant yet")
                    .build();
        }

        Tenant tenant = tenantOpt.get();
        boolean canLink = tenant.getKycStatus() == KycStatus.APPROVED
                || tenant.getKycStatus() == KycStatus.VERIFIED;

        return TenantLookupResponse.builder()
                .registered(true)
                .phone(normalized)
                .fullName(user.getFullName())
                .kycStatus(tenant.getKycStatus())
                .canLinkImmediately(canLink)
                .message(canLink
                        ? "Existing Mkeja tenant — invite will create a tenancy directly"
                        : "Tenant exists but must complete KYC before move-in")
                .build();
    }

    @Transactional
    public InvitationResponse createInvitation(CreateInvitationRequest request, User landlord) {
        PropertyUnit unit = authorizationService.requireUnitAccess(landlord, request.getUnitId());
        if (roleService.isPropertyOwner(landlord)) {
            authorizationService.requireVerifiedLandlord(landlord);
        } else if (roleService.hasRole(landlord, RoleName.AGENT)) {
            authorizationService.requireVerifiedAgent(landlord);
        }

        if (unit.getStatus() != UnitStatus.VACANT) {
            throw new BadRequestException("Unit is not vacant");
        }

        String normalizedPhone = UserFieldNormalizer.normalizePhone(request.getPhone());
        int rentDueDay = resolveRentDueDay(request.getRentDueDay(), unit.getProperty());

        Optional<User> existingUser = userRepository.findByPhone(normalizedPhone);
        Optional<Tenant> existingTenant = existingUser.flatMap(u -> tenantRepository.findByUserId(u.getId()));

        String code = UUID.randomUUID().toString();
        TenantInvitation invitation = new TenantInvitation();
        invitation.setCode(code);
        invitation.setLandlord(landlord);
        invitation.setUnit(unit);
        invitation.setTenantPhone(normalizedPhone);
        invitation.setTenantEmail(request.getEmail());
        invitation.setTenantName(request.getFullName());
        invitation.setMonthlyRent(request.getMonthlyRent());
        invitation.setDepositAmount(request.getDepositAmount());
        invitation.setPaymentPlan(PaymentPlan.MONTHLY);
        invitation.setRentDueDay(rentDueDay);
        invitation.setLeaseStartDate(request.getLeaseStartDate());
        invitation.setLeaseEndDate(request.getLeaseEndDate());
        invitation.setStatus(InvitationStatus.PENDING);
        invitation.setExpiresAt(LocalDateTime.now().plusDays(7));

        existingTenant.ifPresent(invitation::setLinkedTenant);

        String invitationUrl = "/tenant/onboarding/invitation/" + code;
        invitation.setQrCodeUrl(invitationUrl);
        invitationRepository.save(invitation);

        boolean tenancyCreated = false;
        Long tenancyId = null;
        String flowType = "NEW_TENANT_ONBOARDING";
        String message;

        if (existingTenant.isPresent()) {
            Tenant tenant = existingTenant.get();
            flowType = "EXISTING_TENANT";
            if (tenant.getKycStatus() == KycStatus.APPROVED || tenant.getKycStatus() == KycStatus.VERIFIED) {
                TenancyCreationResponse created = tenancyCreationService.createTenancyFromInvitation(tenant, invitation);
                tenancyCreated = true;
                tenancyId = Long.parseLong(created.getTenancyId());
                message = "Tenancy created with " + tenant.getUser().getFullName()
                        + ". They'll see the new unit in their Mkeja app.";
            } else {
                message = "Invitation sent. " + tenant.getUser().getFullName()
                        + " must complete KYC before the tenancy activates.";
                log.info("Invitation SMS stub: existing tenant pending KYC — link {} to {}", invitationUrl, normalizedPhone);
            }
        }
        else {
            message = "Invitation sent. Tenant will register once via the link.";
            log.info("Invitation SMS stub: send link {} to {} with code: {}", invitationUrl, normalizedPhone, invitation.getCode());
        }

        if (request.getEmail() != null && !request.getEmail().isBlank()) {
            log.info("Invitation email stub: send link {} to {} with code: {}", invitationUrl, request.getEmail(), invitation.getCode());
        }

        eventPublisher.publish(OnboardingEvent.of(
                OnboardingEventType.INVITATION_SENT,
                code,
                Map.of("unitId", unit.getId(), "phone", normalizedPhone, "flowType", flowType)));

        return toResponse(invitation, invitationUrl, message, existingTenant.isPresent(),
                existingTenant.map(Tenant::getKycStatus).orElse(null),
                tenancyCreated, tenancyId, flowType);
    }

    @Transactional(readOnly = true)
    public List<TenantInvitationSummaryResponse> listPendingInvitationsForTenant(User tenantUser) {
        String phone = UserFieldNormalizer.normalizePhone(tenantUser.getPhone());
        return invitationRepository.findActiveByTenantPhone(phone).stream()
                .map(this::toTenantSummary)
                .toList();
    }

    @Transactional
    public InvitationResponse getInvitation(String code) {
        TenantInvitation invitation = findValidInvitation(code);
        if (invitation.getStatus() == InvitationStatus.PENDING) {
            invitation.setStatus(InvitationStatus.VIEWED);
            invitationRepository.save(invitation);
        }
        boolean existing = invitation.getLinkedTenant() != null;
        KycStatus kyc = existing ? invitation.getLinkedTenant().getKycStatus() : null;
        return toResponse(invitation, "/tenant/onboarding/invitation/" + code, null,
                existing, kyc, false, null,
                existing ? "EXISTING_TENANT" : "NEW_TENANT_ONBOARDING");
    }

    @Transactional
    public void acceptInvitation(String code) {
        TenantInvitation invitation = findValidInvitation(code);
        if (invitation.getStatus() != InvitationStatus.ACCEPTED) {
            invitation.setStatus(InvitationStatus.ACCEPTED);
            invitation.setAcceptedAt(LocalDateTime.now());
            invitationRepository.save(invitation);
        }
    }

    public TenantInvitation findValidInvitation(String code) {
        TenantInvitation invitation = invitationRepository.findByCode(code)
                .orElseThrow(() -> new ResourceNotFoundException("Invitation not found"));

        if (invitation.getStatus() == InvitationStatus.EXPIRED
                || invitation.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new BadRequestException("Invitation has expired");
        }
        if (invitation.getStatus() == InvitationStatus.CANCELLED) {
            throw new BadRequestException("Invitation has been cancelled");
        }
        return invitation;
    }

    private int resolveRentDueDay(Integer requested, Property property) {
        if (requested != null && requested >= 1 && requested <= 28) {
            return requested;
        }
        if (property.getRentCollectionDay() != null && !property.getRentCollectionDay().isBlank()) {
            try {
                int parsed = Integer.parseInt(property.getRentCollectionDay().replaceAll("\\D", ""));
                if (parsed >= 1 && parsed <= 28) {
                    return parsed;
                }
            } catch (NumberFormatException ignored) {
                // fall through
            }
        }
        return 1;
    }

    private InvitationResponse toResponse(TenantInvitation invitation, String invitationUrl, String message,
                                          boolean existingTenant, KycStatus kycStatus,
                                          boolean tenancyCreated, Long tenancyId, String flowType) {
        PropertyUnit unit = invitation.getUnit();
        return InvitationResponse.builder()
                .code(invitation.getCode())
                .landlordName(invitation.getLandlord().getFullName())
                .unitName(unit.getUnitNumber())
                .monthlyRent(invitation.getMonthlyRent())
                .depositAmount(invitation.getDepositAmount())
                .rentDueDay(invitation.getRentDueDay())
                .leaseStartDate(invitation.getLeaseStartDate())
                .leaseEndDate(invitation.getLeaseEndDate())
                .address(unit.getProperty() != null ? unit.getProperty().getAddress() : "")
                .invitationUrl(invitationUrl)
                .qrCodeUrl(invitation.getQrCodeUrl())
                .message(message)
                .existingTenant(existingTenant)
                .tenantKycStatus(kycStatus != null ? kycStatus.name() : null)
                .tenancyCreated(tenancyCreated)
                .tenancyId(tenancyId)
                .flowType(flowType)
                .build();
    }

    private TenantInvitationSummaryResponse toTenantSummary(TenantInvitationRow row) {
        return TenantInvitationSummaryResponse.builder()
                .code(row.getCode())
                .status(InvitationStatus.valueOf(row.getStatus()))
                .landlordName(row.getLandlordName())
                .propertyName(row.getPropertyName())
                .unitNumber(row.getUnitNumber())
                .unitId(row.getUnitId())
                .propertyId(row.getPropertyId())
                .monthlyRent(row.getMonthlyRent())
                .leaseStartDate(row.getLeaseStartDate())
                .expiresAt(row.getExpiresAt())
                .invitationUrl("/tenant/onboarding/invitation/" + row.getCode())
                .build();
    }
}

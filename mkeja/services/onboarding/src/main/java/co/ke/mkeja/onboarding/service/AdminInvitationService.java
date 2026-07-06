package co.ke.mkeja.onboarding.service;

import co.ke.mkeja.onboarding.dto.response.AdminInvitationSummaryResponse;
import co.ke.mkeja.onboarding.exception.BadRequestException;
import co.ke.mkeja.onboarding.exception.ResourceNotFoundException;
import co.ke.mkeja.onboarding.model.entity.TenantInvitation;
import co.ke.mkeja.onboarding.model.entity.User;
import co.ke.mkeja.onboarding.model.enums.InvitationStatus;
import co.ke.mkeja.onboarding.repository.TenantInvitationRepository;
import co.ke.mkeja.onboarding.repository.projection.AdminInvitationRow;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Locale;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class AdminInvitationService {

    private final TenantInvitationRepository invitationRepository;

    @Transactional(readOnly = true)
    public List<AdminInvitationSummaryResponse> listInvitations(String status, String search) {
        return invitationRepository.findAllAdminSummaries().stream()
                .filter(row -> matchesStatus(row, status))
                .filter(row -> matchesSearch(row, search))
                .map(this::toSummary)
                .collect(Collectors.toList());
    }

    @Transactional
    public AdminInvitationSummaryResponse cancelInvitation(Long invitationId, User admin) {
        TenantInvitation invitation = invitationRepository.findById(invitationId)
                .orElseThrow(() -> new ResourceNotFoundException("Invitation not found"));
        if (invitation.getDeletedAt() != null) {
            throw new ResourceNotFoundException("Invitation not found");
        }
        if (invitation.getStatus() == InvitationStatus.ACCEPTED) {
            throw new BadRequestException("Accepted invitations cannot be cancelled");
        }
        if (invitation.getStatus() == InvitationStatus.CANCELLED) {
            throw new BadRequestException("Invitation is already cancelled");
        }

        invitation.setStatus(InvitationStatus.CANCELLED);
        invitationRepository.save(invitation);
        log.info("Admin {} cancelled invitation {}", admin.getId(), invitationId);
        return invitationRepository.findAllAdminSummaries().stream()
                .filter(row -> row.getId().equals(invitationId))
                .findFirst()
                .map(this::toSummary)
                .orElseThrow(() -> new ResourceNotFoundException("Invitation not found"));
    }

    private AdminInvitationSummaryResponse toSummary(AdminInvitationRow row) {
        return AdminInvitationSummaryResponse.builder()
                .id(row.getId())
                .code(row.getCode())
                .status(row.getStatus())
                .tenantName(row.getTenantName())
                .tenantPhone(row.getTenantPhone())
                .landlordName(row.getLandlordName())
                .landlordUserId(row.getLandlordUserId() != null ? String.valueOf(row.getLandlordUserId()) : null)
                .propertyName(row.getPropertyName())
                .propertyId(row.getPropertyId())
                .unitNumber(row.getUnitNumber())
                .unitId(row.getUnitId())
                .monthlyRent(row.getMonthlyRent())
                .leaseStartDate(row.getLeaseStartDate())
                .expiresAt(row.getExpiresAt())
                .createdAt(row.getCreatedAt())
                .build();
    }

    private boolean matchesStatus(AdminInvitationRow row, String status) {
        if (status == null || status.isBlank() || "all".equalsIgnoreCase(status)) {
            return true;
        }
        return row.getStatus() != null && row.getStatus().equalsIgnoreCase(status.trim());
    }

    private boolean matchesSearch(AdminInvitationRow row, String search) {
        if (search == null || search.isBlank()) {
            return true;
        }
        String term = search.toLowerCase(Locale.ROOT);
        return (row.getTenantName() != null && row.getTenantName().toLowerCase(Locale.ROOT).contains(term))
                || (row.getTenantPhone() != null && row.getTenantPhone().contains(term))
                || (row.getLandlordName() != null && row.getLandlordName().toLowerCase(Locale.ROOT).contains(term))
                || (row.getPropertyName() != null && row.getPropertyName().toLowerCase(Locale.ROOT).contains(term))
                || (row.getUnitNumber() != null && row.getUnitNumber().toLowerCase(Locale.ROOT).contains(term))
                || String.valueOf(row.getId()).contains(term)
                || (row.getCode() != null && row.getCode().toLowerCase(Locale.ROOT).contains(term));
    }
}

package co.ke.mkeja.discovery.service;

import co.ke.mkeja.discovery.client.NotificationClient;
import co.ke.mkeja.discovery.dto.InterestRequest;
import co.ke.mkeja.discovery.dto.ListingInterestResponse;
import co.ke.mkeja.discovery.dto.ListingResponse;
import co.ke.mkeja.discovery.dto.PublicInterestRequest;
import co.ke.mkeja.discovery.exception.BadRequestException;
import co.ke.mkeja.discovery.model.entity.ListingInterest;
import co.ke.mkeja.discovery.model.enums.InterestStatus;
import co.ke.mkeja.discovery.repository.ListingInterestRepository;
import co.ke.mkeja.discovery.util.PhoneUtil;
import jakarta.persistence.EntityManager;
import jakarta.persistence.NoResultException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class ListingInterestService {

    private final ListingInterestRepository listingInterestRepository;
    private final CatalogService catalogService;
    private final TenantContextService tenantContextService;
    private final EntityManager entityManager;
    private final NotificationClient notificationClient;

    @Transactional
    public ListingInterestResponse expressInterest(TenantContextService.TenantContext tenant,
                                                   Long unitId,
                                                   InterestRequest request) {
        ListingResponse listing = catalogService.getListing(unitId, null);

        List<InterestStatus> openStatuses = List.of(InterestStatus.NEW, InterestStatus.CONTACTED);
        if (listingInterestRepository.existsByTenantUserIdAndUnitIdAndStatusIn(
                tenant.userId(), unitId, openStatuses)) {
            throw new BadRequestException("You already expressed interest in this listing");
        }

        return saveInterest(
                listing,
                unitId,
                tenant.userId(),
                tenant.tenantId(),
                tenant.fullName(),
                tenant.phone(),
                request != null ? request.getMessage() : null
        );
    }

    @Transactional
    public ListingInterestResponse expressPublicInterest(Long unitId, PublicInterestRequest request) {
        if (request == null) {
            throw new BadRequestException("Name and phone are required");
        }

        String fullName = request.getFullName() != null ? request.getFullName().trim() : "";
        if (fullName.isBlank()) {
            throw new BadRequestException("Full name is required");
        }

        String phone = PhoneUtil.normalizeKenyanPhone(request.getPhone());
        ListingResponse listing = catalogService.getListing(unitId, null);
        List<InterestStatus> openStatuses = List.of(InterestStatus.NEW, InterestStatus.CONTACTED);

        if (listingInterestRepository.existsByTenantPhoneAndUnitIdAndStatusIn(phone, unitId, openStatuses)) {
            throw new BadRequestException("You already expressed interest in this listing");
        }

        Long tenantUserId = null;
        Long tenantId = null;
        String tenantName = fullName;
        String tenantPhone = phone;

        var tenantProfile = tenantContextService.loadTenantContext(phone);
        if (tenantProfile.isPresent()) {
            var tenant = tenantProfile.get();
            tenantUserId = tenant.userId();
            tenantId = tenant.tenantId();
            tenantPhone = tenant.phone();
            if (tenant.fullName() != null && !tenant.fullName().isBlank()) {
                tenantName = tenant.fullName();
            }
        } else {
            tenantUserId = tenantContextService.loadUserIdByPhone(phone).orElse(null);
        }

        return saveInterest(
                listing,
                unitId,
                tenantUserId,
                tenantId,
                tenantName,
                tenantPhone,
                request.getMessage()
        );
    }

    private ListingInterestResponse saveInterest(ListingResponse listing,
                                                 Long unitId,
                                                 Long tenantUserId,
                                                 Long tenantId,
                                                 String tenantName,
                                                 String tenantPhone,
                                                 String message) {
        Long landlordUserId = resolveLandlordUserId(unitId);

        ListingInterest interest = new ListingInterest();
        interest.setTenantUserId(tenantUserId);
        interest.setTenantId(tenantId);
        interest.setTenantName(tenantName);
        interest.setTenantPhone(tenantPhone);
        interest.setUnitId(unitId);
        interest.setPropertyId(listing.getPropertyId());
        interest.setLandlordUserId(landlordUserId);
        interest.setUnitLabel(buildUnitLabel(unitId));
        interest.setPropertyName(listing.getPropertyName());
        interest.setMonthlyRent(listing.getRent());
        interest.setStatus(InterestStatus.NEW);
        interest.setMessage(message);
        interest = listingInterestRepository.save(interest);

        publishListingInterestNotificationAfterCommit(
                interest,
                listing.getPropertyName(),
                unitId);

        return toResponse(interest);
    }

    @Transactional(readOnly = true)
    public List<ListingInterestResponse> listLandlordLeads(Long landlordUserId) {
        return listingInterestRepository.findByLandlordUserIdOrderByCreatedAtDesc(landlordUserId).stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public ListingInterestResponse updateLeadStatus(Long landlordUserId, Long leadId, InterestStatus status) {
        ListingInterest interest = listingInterestRepository.findByIdAndLandlordUserId(leadId, landlordUserId)
                .orElseThrow(() -> new BadRequestException("Lead not found"));
        interest.setStatus(status);
        return toResponse(listingInterestRepository.save(interest));
    }

    private String buildUnitLabel(Long unitId) {
        String sql = """
                SELECT u.unit_number, u.floor_number, u.wing
                FROM tbl_property_unit u
                WHERE u.id = :unitId
                """;
        try {
            Object[] row = (Object[]) entityManager.createNativeQuery(sql)
                    .setParameter("unitId", unitId)
                    .getSingleResult();
            StringBuilder label = new StringBuilder(String.valueOf(row[0]));
            if (row[1] != null) {
                label.append(" · Floor ").append(row[1]);
            }
            if (row[2] != null && !String.valueOf(row[2]).isBlank()) {
                label.append(" · Wing ").append(row[2]);
            }
            return label.toString();
        } catch (Exception e) {
            return "Unit " + unitId;
        }
    }

    private Long resolveLandlordUserId(Long unitId) {
        String sql = """
                SELECT po.user_id
                FROM tbl_property_unit u
                JOIN tbl_properties p ON u.property_id = p.id
                JOIN tbl_property_owner po ON p.owner_id = po.id
                WHERE u.id = :unitId
                """;
        try {
            Number id = (Number) entityManager.createNativeQuery(sql)
                    .setParameter("unitId", unitId)
                    .getSingleResult();
            return id.longValue();
        } catch (NoResultException e) {
            throw new BadRequestException("Unable to resolve landlord for listing");
        }
    }

    private void publishListingInterestNotificationAfterCommit(ListingInterest interest,
                                                               String propertyName,
                                                               Long unitId) {
        Map<String, Object> payload = Map.of(
                "landlordUserId", interest.getLandlordUserId(),
                "tenantName", interest.getTenantName(),
                "tenantPhone", interest.getTenantPhone(),
                "propertyName", propertyName,
                "unitLabel", interest.getUnitLabel(),
                "unitId", unitId);

        Runnable publish = () -> notificationClient.publishListingInterestCreated(
                String.valueOf(interest.getId()),
                payload);

        if (!TransactionSynchronizationManager.isSynchronizationActive()) {
            publish.run();
            return;
        }

        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCommit() {
                publish.run();
            }
        });
    }

    private ListingInterestResponse toResponse(ListingInterest interest) {
        return ListingInterestResponse.builder()
                .id(interest.getId())
                .unitId(interest.getUnitId())
                .propertyId(interest.getPropertyId())
                .tenantName(interest.getTenantName())
                .tenantPhone(interest.getTenantPhone())
                .unitLabel(interest.getUnitLabel())
                .propertyName(interest.getPropertyName())
                .monthlyRent(interest.getMonthlyRent())
                .status(interest.getStatus().name())
                .message(interest.getMessage())
                .createdAt(interest.getCreatedAt())
                .build();
    }
}

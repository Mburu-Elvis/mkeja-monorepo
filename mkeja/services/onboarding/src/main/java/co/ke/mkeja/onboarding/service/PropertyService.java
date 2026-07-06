package co.ke.mkeja.onboarding.service;

import co.ke.mkeja.onboarding.dto.request.CreatePropertyRequest;
import co.ke.mkeja.onboarding.dto.request.CreateUnitRequest;
import co.ke.mkeja.onboarding.dto.request.UpdateHouseHuntRequest;
import co.ke.mkeja.onboarding.dto.request.UpdateUnitListingRequest;
import co.ke.mkeja.onboarding.dto.request.UpdateUnitRequest;
import co.ke.mkeja.onboarding.dto.response.AdminPropertyDetailResponse;
import co.ke.mkeja.onboarding.dto.response.HouseHuntSettingsResponse;
import co.ke.mkeja.onboarding.dto.response.PropertyResponse;
import co.ke.mkeja.onboarding.dto.response.UnitListingSummary;
import co.ke.mkeja.onboarding.dto.response.UnitResponse;
import co.ke.mkeja.onboarding.event.EventPublisher;
import co.ke.mkeja.onboarding.event.OnboardingEvent;
import co.ke.mkeja.onboarding.event.OnboardingEventType;
import co.ke.mkeja.onboarding.exception.BadRequestException;
import co.ke.mkeja.onboarding.exception.ResourceNotFoundException;
import co.ke.mkeja.onboarding.model.entity.Property;
import co.ke.mkeja.onboarding.model.entity.PropertyOwner;
import co.ke.mkeja.onboarding.model.entity.PropertyUnit;
import co.ke.mkeja.onboarding.model.entity.User;
import co.ke.mkeja.onboarding.model.enums.PropertyStatus;
import co.ke.mkeja.onboarding.model.enums.UnitStatus;
import co.ke.mkeja.onboarding.model.enums.UnitType;
import co.ke.mkeja.onboarding.model.enums.InvitationStatus;
import co.ke.mkeja.onboarding.repository.PropertyRepository;
import co.ke.mkeja.onboarding.repository.PropertyImageRepository;
import co.ke.mkeja.onboarding.repository.PropertyUnitRepository;
import co.ke.mkeja.onboarding.repository.TenantInvitationRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.LocalDateTime;
import java.time.LocalDate;
import java.time.format.TextStyle;
import java.util.List;
import java.util.Comparator;
import java.util.LinkedHashSet;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.ArrayList;

@Service
@RequiredArgsConstructor
public class PropertyService {

    private final PropertyRepository propertyRepository;
    private final PropertyUnitRepository propertyUnitRepository;
    private final PropertyImageRepository propertyImageRepository;
    private final TenantInvitationRepository invitationRepository;
    private final FileStorageService fileStorageService;
    private final EventPublisher eventPublisher;
    private final AuthorizationService authorizationService;
    private final HouseHuntService houseHuntService;
    private final PropertyImageService propertyImageService;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Transactional
    public PropertyResponse createProperty(User user, String propertyDataJson,
                                         List<MultipartFile> images,
                                         List<MultipartFile> documents) throws IOException {
        PropertyOwner owner = authorizationService.requireVerifiedLandlord(user);
        CreatePropertyRequest request = parsePropertyWizard(propertyDataJson);

        Property property = new Property();
        property.setOwner(owner);
        property.setName(request.getName());
        property.setPropertyType(request.getPropertyType());
        property.setDescription(request.getDescription());
        property.setAddress(request.getAddress());
        property.setCity(request.getCity());
        property.setCounty(request.getCounty());
        property.setAmenities(request.getAmenities());
        property.setYearBuilt(request.getYearBuilt());
        property.setTotalUnits(request.getTotalUnits() != null ? request.getTotalUnits() : 0);
        property.setPropertyStatus(PropertyStatus.PENDING_VERIFICATION);
        property.setVerified(false);
        property = propertyRepository.save(property);

        if (images != null) {
            for (MultipartFile image : images) {
                if (image != null && !image.isEmpty()) {
                    propertyImageService.uploadPropertyImage(user, property.getId(), image, null);
                }
            }
        }
        if (documents != null) {
            for (MultipartFile document : documents) {
                if (document != null && !document.isEmpty()) {
                    fileStorageService.storeMultipart(document, "property_" + property.getId() + "_ownership");
                }
            }
        }

        eventPublisher.publish(OnboardingEvent.of(
                OnboardingEventType.PROPERTY_CREATED,
                String.valueOf(property.getId()),
                Map.of("ownerId", owner.getId(), "name", property.getName())));

        createInitialUnitsFromWizard(property, propertyDataJson);

        return toPropertyResponse(property);
    }

    @Transactional(readOnly = true)
    public List<PropertyResponse> listProperties(User user) {
        return authorizationService.listAccessibleProperties(user).stream()
                .map(this::toPropertyResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public PropertyResponse getProperty(User user, Long propertyId) {
        Property property = authorizationService.requirePropertyAccess(user, propertyId);
        return toPropertyResponse(property);
    }

    @Transactional
    public UnitResponse createUnit(User user, Long propertyId, CreateUnitRequest request) {
        Property property = authorizationService.requireOwnedProperty(user, propertyId);
        authorizationService.requireVerifiedLandlord(user);
        return saveUnit(property, request);
    }

    @Transactional
    public UnitResponse createUnitFromWizard(User user, Long propertyId, String payloadJson) throws IOException {
        JsonNode root = objectMapper.readTree(payloadJson);
        CreateUnitRequest request = new CreateUnitRequest();
        JsonNode unit = root.path("unit");
        JsonNode pricing = root.path("pricing");
        request.setUnitNumber(unit.path("unitNumber").asText());
        request.setFloorNumber(unit.path("floor").isNull() ? null : unit.path("floor").asInt());
        request.setWing(unit.path("block").asText(null));
        request.setUnitType(mapWizardUnitType(unit.path("type").asText(null)));
        request.setBedrooms(bedroomsForType(request.getUnitType()));
        request.setRent(pricing.path("rent").asDouble());
        request.setDeposit(pricing.path("deposit").asDouble());
        request.setServiceFee(pricing.path("serviceCharge").asDouble(0));
        request.setBedrooms(null);
        request.setBathrooms(null);
        return createUnit(user, propertyId, request);
    }

    @Transactional(readOnly = true)
    public List<UnitResponse> listUnits(User user, Long propertyId, boolean vacantOnly) {
        Property property = authorizationService.requirePropertyAccess(user, propertyId);
        List<PropertyUnit> units = vacantOnly
                ? propertyUnitRepository.findByPropertyIdAndStatus(property.getId(), UnitStatus.VACANT)
                : propertyUnitRepository.findByPropertyId(property.getId());
        return units.stream()
                .map(u -> toUnitResponse(u, buildQrUrl(u)))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<String> listPropertyUnitTypes(User user, Long propertyId) {
        authorizationService.requirePropertyAccess(user, propertyId);
        LinkedHashSet<String> types = new LinkedHashSet<>();

        propertyUnitRepository.findDistinctUnitTypesByPropertyId(propertyId)
                .forEach(type -> types.add(type.name()));

        propertyImageRepository.findDistinctSampleUnitTypesByPropertyId(propertyId)
                .forEach(type -> types.add(type.name()));

        propertyUnitRepository.findByPropertyId(propertyId).stream()
                .filter(unit -> unit.getUnitType() == null)
                .map(unit -> inferUnitTypeFromUnitNumber(unit.getUnitNumber()))
                .filter(Objects::nonNull)
                .forEach(type -> types.add(type.name()));

        return new ArrayList<>(types);
    }

    private UnitType inferUnitTypeFromUnitNumber(String unitNumber) {
        if (unitNumber == null || unitNumber.isBlank()) {
            return null;
        }
        int dash = unitNumber.indexOf('-');
        String label = dash > 0 ? unitNumber.substring(0, dash).trim() : unitNumber.trim();
        return mapWizardUnitType(label);
    }

    @Transactional(readOnly = true)
    public List<UnitResponse> listVacantUnitsForLandlord(User user) {
        return authorizationService.listAccessibleProperties(user).stream()
                .flatMap(property -> propertyUnitRepository
                        .findByPropertyIdAndStatus(property.getId(), UnitStatus.VACANT).stream())
                .map(u -> toUnitResponse(u, buildQrUrl(u)))
                .toList();
    }

    @Transactional(readOnly = true)
    public UnitResponse getUnitListing(User user, Long propertyId, Long unitId) {
        authorizationService.requirePropertyAccess(user, propertyId);
        PropertyUnit unit = authorizationService.requireUnitAccess(user, unitId);
        if (!unit.getProperty().getId().equals(propertyId)) {
            throw new BadRequestException("Unit does not belong to property");
        }
        return toUnitResponse(unit, buildQrUrl(unit));
    }

    @Transactional
    public UnitResponse updateUnit(User user, Long propertyId, Long unitId, UpdateUnitRequest request) {
        authorizationService.requirePropertyAccess(user, propertyId);
        PropertyUnit unit = authorizationService.requireUnitAccess(user, unitId);
        if (!unit.getProperty().getId().equals(propertyId)) {
            throw new BadRequestException("Unit does not belong to property");
        }

        if (request.getUnitType() != null) {
            unit.setUnitType(request.getUnitType());
            unit.setBedrooms(bedroomsForType(request.getUnitType()));
        }
        if (request.getRent() != null) {
            unit.setRent(request.getRent());
        }
        if (request.getDeposit() != null) {
            unit.setDeposit(request.getDeposit());
        }
        if (request.getFloorNumber() != null) {
            unit.setFloorNumber(request.getFloorNumber());
        }
        if (request.getWing() != null) {
            unit.setWing(request.getWing());
        }
        if (request.getStatus() != null) {
            unit.setStatus(request.getStatus());
            if (request.getStatus() == UnitStatus.VACANT && unit.getTenant() != null) {
                unit.setTenant(null);
            }
        }

        propertyUnitRepository.save(unit);
        houseHuntService.syncUnitListing(unit.getProperty(), unit);

        return toUnitResponse(unit, buildQrUrl(unit));
    }

    @Transactional
    public UnitResponse updateUnitListing(User user, Long propertyId, Long unitId, UpdateUnitListingRequest request) {
        authorizationService.requirePropertyAccess(user, propertyId);
        PropertyUnit unit = authorizationService.requireUnitAccess(user, unitId);
        if (!unit.getProperty().getId().equals(propertyId)) {
            throw new BadRequestException("Unit does not belong to property");
        }

        if (Boolean.TRUE.equals(request.getDiscoverable()) || Boolean.TRUE.equals(request.getAutoRecommend())) {
            throw new BadRequestException("Use property House Hunt settings to manage discoverability and recommendations");
        }

        if (request.getPromoted() != null) {
            unit.setPromoted(request.getPromoted());
        }
        if (request.getListingDescription() != null) {
            unit.setListingDescription(request.getListingDescription());
        }
        if (request.getAvailableFrom() != null) {
            unit.setAvailableFrom(request.getAvailableFrom());
        }

        propertyUnitRepository.save(unit);
        eventPublisher.publish(OnboardingEvent.of(
                OnboardingEventType.LISTING_UPDATED,
                String.valueOf(unit.getId()),
                Map.of("discoverable", unit.isDiscoverable(), "autoRecommend", unit.isAutoRecommend())));

        return toUnitResponse(unit, buildQrUrl(unit));
    }

    @Transactional(readOnly = true)
    public HouseHuntSettingsResponse getHouseHuntSettings(User user, Long propertyId) {
        Property property = authorizationService.requirePropertyAccess(user, propertyId);
        return buildHouseHuntSettings(property);
    }

    @Transactional
    public HouseHuntSettingsResponse updateHouseHuntSettings(User user, Long propertyId, UpdateHouseHuntRequest request) {
        Property property = authorizationService.requirePropertyAccess(user, propertyId);

        if (Boolean.TRUE.equals(request.getHouseHuntEnabled()) || Boolean.TRUE.equals(request.getAutoRecommendEnabled())) {
            authorizationService.requireVerifiedLandlord(user);
            if (!property.isVerified()) {
                throw new BadRequestException("Property must be verified before enabling House Hunt");
            }
        }

        if (request.getHouseHuntEnabled() != null) {
            property.setHouseHuntEnabled(request.getHouseHuntEnabled());
        }
        if (request.getAutoRecommendEnabled() != null) {
            if (Boolean.TRUE.equals(request.getAutoRecommendEnabled()) && !property.isHouseHuntEnabled()) {
                property.setHouseHuntEnabled(true);
            }
            property.setAutoRecommendEnabled(request.getAutoRecommendEnabled());
        }

        propertyRepository.save(property);
        houseHuntService.syncPropertyListings(property);

        eventPublisher.publish(OnboardingEvent.of(
                OnboardingEventType.LISTING_UPDATED,
                String.valueOf(property.getId()),
                Map.of(
                        "houseHuntEnabled", property.isHouseHuntEnabled(),
                        "autoRecommendEnabled", property.isAutoRecommendEnabled())));

        return buildHouseHuntSettings(property);
    }

    private HouseHuntSettingsResponse buildHouseHuntSettings(Property property) {
        List<PropertyUnit> units = propertyUnitRepository.findByPropertyId(property.getId());
        List<UnitListingSummary> summaries = units.stream()
                .map(unit -> UnitListingSummary.builder()
                        .unitId(unit.getId())
                        .unitNumber(unit.getUnitNumber())
                        .status(unit.getStatus().name())
                        .discoverable(unit.isDiscoverable())
                        .autoRecommend(unit.isAutoRecommend())
                        .promoted(unit.isPromoted())
                        .listingDescription(unit.getListingDescription())
                        .rent(unit.getRent())
                        .coverImageUrl(propertyImageService.resolveUnitTypeSampleUrl(property.getId(), unit.getUnitType()))
                        .imageUrls(propertyImageService.resolveGalleryImageUrls(property.getId(), unit.getUnitType()))
                        .build())
                .toList();

        int listed = (int) units.stream().filter(PropertyUnit::isDiscoverable).count();
        int autoRecommend = (int) units.stream().filter(PropertyUnit::isAutoRecommend).count();
        int vacant = (int) units.stream().filter(u -> u.getStatus() == UnitStatus.VACANT).count();

        return HouseHuntSettingsResponse.builder()
                .propertyId(property.getId())
                .propertyName(property.getName())
                .verified(property.isVerified())
                .houseHuntEnabled(property.isHouseHuntEnabled())
                .autoRecommendEnabled(property.isAutoRecommendEnabled())
                .vacantUnits(vacant)
                .listedUnits(listed)
                .autoRecommendUnits(autoRecommend)
                .units(summaries)
                .build();
    }

    @Transactional
    public PropertyResponse verifyProperty(Long propertyId, User admin) {
        Property property = propertyRepository.findById(propertyId)
                .orElseThrow(() -> new ResourceNotFoundException("Property not found"));
        property.setPropertyStatus(PropertyStatus.VERIFIED);
        property.setVerified(true);
        property.setVerifiedAt(LocalDateTime.now());
        property.setVerifiedBy(admin);
        propertyRepository.save(property);
        houseHuntService.syncPropertyListings(property);

        eventPublisher.publish(OnboardingEvent.of(
                OnboardingEventType.PROPERTY_VERIFIED,
                String.valueOf(property.getId()),
                Map.of("verifiedBy", admin.getId())));

        return toPropertyResponse(property);
    }

    @Transactional
    public PropertyResponse rejectProperty(Long propertyId, User admin) {
        Property property = propertyRepository.findById(propertyId)
                .orElseThrow(() -> new ResourceNotFoundException("Property not found"));
        property.setPropertyStatus(PropertyStatus.REJECTED);
        property.setVerified(false);
        property.setHouseHuntEnabled(false);
        property.setAutoRecommendEnabled(false);
        propertyRepository.save(property);
        houseHuntService.syncPropertyListings(property);

        eventPublisher.publish(OnboardingEvent.of(
                OnboardingEventType.PROPERTY_VERIFIED,
                String.valueOf(property.getId()),
                Map.of("rejectedBy", admin.getId(), "action", "rejected")));

        return toPropertyResponse(property);
    }

    @Transactional(readOnly = true)
    public List<PropertyResponse> listPendingVerification() {
        return propertyRepository.findByPropertyStatusAndDeletedAtIsNull(PropertyStatus.PENDING_VERIFICATION).stream()
                .map(this::toPropertyResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<PropertyResponse> listAllForAdmin(String status) {
        List<Property> properties;
        if (status == null || status.isBlank() || "all".equalsIgnoreCase(status)) {
            properties = propertyRepository.findAllByDeletedAtIsNull();
        } else {
            try {
                PropertyStatus propertyStatus = PropertyStatus.valueOf(status.toUpperCase(Locale.ROOT));
                properties = propertyRepository.findByPropertyStatusAndDeletedAtIsNull(propertyStatus);
            } catch (IllegalArgumentException ex) {
                properties = propertyRepository.findAllByDeletedAtIsNull();
            }
        }
        return properties.stream()
                .sorted(Comparator.comparing(Property::getCreatedAt, Comparator.nullsLast(Comparator.reverseOrder())))
                .map(this::toPropertyResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public AdminPropertyDetailResponse getPropertyForAdmin(Long propertyId) {
        Property property = propertyRepository.findById(propertyId)
                .orElseThrow(() -> new ResourceNotFoundException("Property not found"));
        if (property.getDeletedAt() != null) {
            throw new ResourceNotFoundException("Property not found");
        }

        List<UnitResponse> units = propertyUnitRepository.findByPropertyId(propertyId).stream()
                .filter(unit -> unit.getDeletedAt() == null)
                .map(unit -> toUnitResponse(unit, buildQrUrl(unit)))
                .toList();

        String landlordName = null;
        String landlordUserId = null;
        if (property.getOwner() != null && property.getOwner().getUser() != null) {
            landlordName = property.getOwner().getUser().getFullName();
            landlordUserId = String.valueOf(property.getOwner().getUser().getId());
        }

        return AdminPropertyDetailResponse.builder()
                .property(toPropertyResponse(property))
                .landlordName(landlordName)
                .landlordUserId(landlordUserId)
                .units(units)
                .build();
    }

    @Transactional(readOnly = true)
    public List<UnitResponse> listVacantUnitsForAdmin(Long propertyId) {
        Property property = propertyRepository.findById(propertyId)
                .orElseThrow(() -> new ResourceNotFoundException("Property not found"));
        if (property.getDeletedAt() != null) {
            throw new ResourceNotFoundException("Property not found");
        }

        return propertyUnitRepository.findByPropertyIdAndStatus(propertyId, UnitStatus.VACANT).stream()
                .filter(unit -> unit.getDeletedAt() == null)
                .map(unit -> toUnitResponse(unit, buildQrUrl(unit)))
                .toList();
    }

    private CreatePropertyRequest parsePropertyWizard(String propertyDataJson) throws IOException {
        JsonNode root = objectMapper.readTree(propertyDataJson);
        CreatePropertyRequest request = new CreatePropertyRequest();
        JsonNode property = root.path("property");
        JsonNode location = root.path("location");
        request.setName(property.path("name").asText());
        request.setPropertyType(property.path("type").asText(null));
        request.setDescription(property.path("description").asText(null));
        request.setYearBuilt(property.path("yearBuilt").isNull() ? null : property.path("yearBuilt").asInt());
        JsonNode structure = root.path("structure");
        int floors = structure.path("floors").isNull() ? 0 : structure.path("floors").asInt();
        if (floors <= 0) {
            floors = property.path("floors").isNull() ? 0 : property.path("floors").asInt();
        }
        request.setTotalUnits(resolveTotalUnits(root));
        request.setAddress(location.path("addressLine1").asText(null));
        request.setCounty(location.path("county").asText(null));
        request.setCity(location.path("area").asText(null));
        if (request.getCity() == null || request.getCity().isBlank()) {
            request.setCity(location.path("subCounty").asText(null));
        }
        request.setAmenities(root.path("utilities").toString());
        if (request.getName() == null || request.getName().isBlank()) {
            throw new BadRequestException("Property name is required");
        }
        return request;
    }

    private int resolveTotalUnits(JsonNode root) {
        JsonNode unitTypes = root.path("unitTypes");
        if (unitTypes.isArray() && !unitTypes.isEmpty()) {
            int sum = 0;
            for (JsonNode unitType : unitTypes) {
                int count = unitType.path("totalUnits").asInt(0);
                if (count > 0) {
                    sum += count;
                }
            }
            if (sum > 0) {
                return sum;
            }
        }
        JsonNode structure = root.path("structure");
        int floors = structure.path("floors").asInt(0);
        int unitsPerFloor = structure.path("unitsPerFloor").asInt(0);
        int blocks = Math.max(1, structure.path("blocks").asInt(1));
        if (floors > 0 && unitsPerFloor > 0) {
            return floors * unitsPerFloor * blocks;
        }
        return root.path("property").path("totalUnits").asInt(0);
    }

    private void createInitialUnitsFromWizard(Property property, String propertyDataJson) throws IOException {
        JsonNode root = objectMapper.readTree(propertyDataJson);
        String generationMode = root.path("unitGenerationMode").asText("auto");
        if ("manual".equalsIgnoreCase(generationMode)) {
            return;
        }

        JsonNode unitTypes = root.path("unitTypes");
        if (!unitTypes.isArray() || unitTypes.isEmpty()) {
            return;
        }

        JsonNode structure = root.path("structure");
        int numberOfBlocks = Math.max(1, structure.path("blocks").asInt(1));
        int numberOfFloors = structure.path("floors").asInt(0);
        if (numberOfFloors <= 0) {
            numberOfFloors = root.path("numberOfFloors").asInt(0);
        }
        if (numberOfFloors <= 0) {
            numberOfFloors = root.path("property").path("floors").asInt(1);
        }
        if (numberOfFloors <= 0) {
            numberOfFloors = 1;
        }

        for (JsonNode unitType : unitTypes) {
            int count = unitType.path("totalUnits").asInt(0);
            if (count <= 0) {
                continue;
            }
            double rent = unitType.path("rent").asDouble(0);
            String typeLabel = unitType.path("type").asText("Unit");
            UnitType mappedType = mapWizardUnitType(typeLabel);
            String configuredBlock = unitType.path("block").asText(null);
            int unitsPerFloor = (count + numberOfFloors - 1) / numberOfFloors;

            for (int i = 0; i < count; i++) {
                int floorNumber = Math.min((i / unitsPerFloor) + 1, numberOfFloors);
                int unitOnFloor = (i % unitsPerFloor) + 1;
                int blockIndex = numberOfBlocks > 1 ? (i % numberOfBlocks) : 0;
                String blockLabel = configuredBlock != null && !configuredBlock.isBlank()
                        ? configuredBlock
                        : (numberOfBlocks > 1 ? "B" + (blockIndex + 1) : null);

                String unitNumber = blockLabel != null
                        ? blockLabel + "-" + typeLabel + "-F" + floorNumber + "-" + unitOnFloor
                        : typeLabel + "-F" + floorNumber + "-" + unitOnFloor;

                CreateUnitRequest unitRequest = new CreateUnitRequest();
                unitRequest.setUnitNumber(unitNumber);
                unitRequest.setFloorNumber(floorNumber);
                unitRequest.setWing(blockLabel);
                unitRequest.setUnitType(mappedType);
                unitRequest.setBedrooms(bedroomsForType(mappedType));
                unitRequest.setRent(rent > 0 ? rent : 1);
                unitRequest.setDeposit(rent > 0 ? rent : 1);
                saveUnit(property, unitRequest);
            }
        }
    }

    private UnitType mapWizardUnitType(String label) {
        if (label == null || label.isBlank()) {
            return null;
        }
        String normalized = label.trim().toUpperCase(Locale.ROOT).replace(' ', '_').replace('-', '_');
        return switch (normalized) {
            case "STUDIO", "BEDSITTER" -> UnitType.STUDIO;
            case "1_BEDROOM", "ONE_BEDROOM", "1BR" -> UnitType.ONE_BEDROOM;
            case "2_BEDROOM", "TWO_BEDROOM", "2BR" -> UnitType.TWO_BEDROOM;
            case "3_BEDROOM", "THREE_BEDROOM", "3BR" -> UnitType.THREE_BEDROOM;
            case "SINGLE" -> UnitType.SINGLE;
            case "DOUBLE" -> UnitType.DOUBLE;
            default -> {
                try {
                    yield UnitType.valueOf(normalized);
                } catch (IllegalArgumentException ex) {
                    yield null;
                }
            }
        };
    }

    private Integer bedroomsForType(UnitType unitType) {
        if (unitType == null) {
            return null;
        }
        return switch (unitType) {
            case STUDIO, BEDSITTER, SINGLE -> 0;
            case ONE_BEDROOM -> 1;
            case TWO_BEDROOM -> 2;
            case THREE_BEDROOM -> 3;
            default -> null;
        };
    }

    private UnitResponse saveUnit(Property property, CreateUnitRequest request) {
        PropertyUnit unit = new PropertyUnit();
        unit.setProperty(property);
        unit.setUnitNumber(request.getUnitNumber());
        unit.setFloorNumber(request.getFloorNumber());
        unit.setWing(request.getWing());
        unit.setUnitType(request.getUnitType());
        unit.setBedrooms(request.getBedrooms());
        unit.setBathrooms(request.getBathrooms());
        unit.setRent(request.getRent());
        unit.setDeposit(request.getDeposit());
        unit.setServiceFee(request.getServiceFee());
        unit.setStatus(UnitStatus.VACANT);
        unit = propertyUnitRepository.save(unit);
        houseHuntService.syncUnitListing(property, unit);

        property.setTotalUnits((int) propertyUnitRepository.findByPropertyId(property.getId()).size());
        propertyRepository.save(property);

        eventPublisher.publish(OnboardingEvent.of(
                OnboardingEventType.UNIT_CREATED,
                String.valueOf(unit.getId()),
                Map.of("propertyId", property.getId(), "unitNumber", unit.getUnitNumber())));

        return toUnitResponse(unit, buildQrUrl(unit));
    }

    private PropertyResponse toPropertyResponse(Property property) {
        List<PropertyUnit> units = propertyUnitRepository.findByPropertyId(property.getId());
        int vacant = (int) units.stream().filter(u -> u.getStatus() == UnitStatus.VACANT).count();
        int occupied = (int) units.stream().filter(u -> u.getStatus() == UnitStatus.OCCUPIED).count();
        double rentRoll = units.stream().mapToDouble(u -> u.getRent() != null ? u.getRent() : 0).sum();
        int pendingInvites = (int) invitationRepository.countPendingByPropertyId(property.getId());
        Integer rentDueDay = parseRentDueDay(property.getRentCollectionDay());

        return PropertyResponse.builder()
                .id(property.getId())
                .name(property.getName())
                .propertyType(property.getPropertyType())
                .description(property.getDescription())
                .address(property.getAddress())
                .city(property.getCity())
                .county(property.getCounty())
                .amenities(property.getAmenities())
                .totalUnits(units.isEmpty() ? property.getTotalUnits() : units.size())
                .propertyStatus(property.getPropertyStatus())
                .verified(property.isVerified())
                .houseHuntEnabled(property.isHouseHuntEnabled())
                .autoRecommendEnabled(property.isAutoRecommendEnabled())
                .coverImageUrl(propertyImageService.resolveCoverUrl(property.getId()))
                .vacantUnits(vacant)
                .occupiedUnits(occupied)
                .rentDueDay(rentDueDay)
                .gracePeriodDays(property.getGracePeriodDays())
                .pendingInvites(pendingInvites)
                .monthlyRentRoll(rentRoll)
                .nextRentDueLabel(formatRentDueLabel(rentDueDay))
                .build();
    }

    private UnitResponse toUnitResponse(PropertyUnit unit, String qrCodeUrl) {
        Integer rentDueDay = parseRentDueDay(unit.getProperty().getRentCollectionDay());
        String tenantName = null;
        String tenantPhone = null;
        if (unit.getTenant() != null && unit.getTenant().getUser() != null) {
            tenantName = unit.getTenant().getUser().getFullName();
            tenantPhone = unit.getTenant().getUser().getPhone();
        }

        boolean pendingInvite = false;
        String pendingInviteCode = null;
        if (unit.getStatus() == UnitStatus.VACANT) {
            var pending = invitationRepository.findFirstByUnitIdAndStatusIn(
                    unit.getId(), List.of(InvitationStatus.PENDING, InvitationStatus.VIEWED));
            if (pending.isPresent()) {
                pendingInvite = true;
                pendingInviteCode = pending.get().getCode();
                rentDueDay = pending.get().getRentDueDay() != null ? pending.get().getRentDueDay() : rentDueDay;
            }
        }

        return UnitResponse.builder()
                .id(unit.getId())
                .propertyId(unit.getProperty().getId())
                .propertyName(unit.getProperty().getName())
                .unitNumber(unit.getUnitNumber())
                .floorNumber(unit.getFloorNumber())
                .wing(unit.getWing())
                .unitType(unit.getUnitType())
                .bedrooms(unit.getBedrooms())
                .bathrooms(unit.getBathrooms())
                .rent(unit.getRent())
                .deposit(unit.getDeposit())
                .status(unit.getStatus())
                .qrCodeUrl(qrCodeUrl)
                .rentDueDay(rentDueDay)
                .tenantName(tenantName)
                .tenantPhone(tenantPhone)
                .tenancyStatus(unit.getStatus() == UnitStatus.OCCUPIED ? "ACTIVE" : null)
                .pendingInvite(pendingInvite)
                .pendingInviteCode(pendingInviteCode)
                .discoverable(unit.isDiscoverable())
                .autoRecommend(unit.isAutoRecommend())
                .promoted(unit.isPromoted())
                .listingDescription(unit.getListingDescription())
                .availableFrom(unit.getAvailableFrom())
                .build();
    }

    private Integer parseRentDueDay(String value) {
        if (value == null || value.isBlank()) {
            return 1;
        }
        try {
            int parsed = Integer.parseInt(value.replaceAll("\\D", ""));
            return parsed >= 1 && parsed <= 28 ? parsed : 1;
        } catch (NumberFormatException e) {
            return 1;
        }
    }

    private String formatRentDueLabel(Integer rentDueDay) {
        int day = rentDueDay != null ? rentDueDay : 1;
        String suffix = day >= 11 && day <= 13 ? "th" :
                switch (day % 10) {
                    case 1 -> "st";
                    case 2 -> "nd";
                    case 3 -> "rd";
                    default -> "th";
                };
        LocalDate next = LocalDate.now().withDayOfMonth(Math.min(day, LocalDate.now().lengthOfMonth()));
        if (!next.isAfter(LocalDate.now())) {
            next = next.plusMonths(1);
            next = next.withDayOfMonth(Math.min(day, next.lengthOfMonth()));
        }
        return day + suffix + " · next " + next.getMonth().getDisplayName(TextStyle.SHORT, Locale.ENGLISH)
                + " " + next.getDayOfMonth();
    }

    private String buildQrUrl(PropertyUnit unit) {
        return "/tenant/onboarding/invitation/qr?unitId=" + unit.getId();
    }
}

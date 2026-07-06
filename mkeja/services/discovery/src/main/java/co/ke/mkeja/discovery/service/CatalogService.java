package co.ke.mkeja.discovery.service;

import co.ke.mkeja.discovery.dto.AvailableUnitResponse;
import co.ke.mkeja.discovery.dto.ListingResponse;
import co.ke.mkeja.discovery.dto.PropertyListingDetailResponse;
import co.ke.mkeja.discovery.dto.PropertyListingResponse;
import co.ke.mkeja.discovery.dto.UnitTypeBreakdown;
import co.ke.mkeja.discovery.exception.ResourceNotFoundException;
import jakarta.persistence.EntityManager;
import jakarta.persistence.Query;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.sql.Date;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class CatalogService {

    private static final String MEDIA_PREFIX = "/api/v1/media/";

    private static final String BASE_CATALOG_SQL = """
            SELECT u.id AS unit_id,
                   p.id AS property_id,
                   p.name AS property_name,
                   u.unit_number,
                   p.address,
                   p.city,
                   p.county,
                   u.rent,
                   u.deposit,
                   u.bedrooms,
                   u.bathrooms,
                   u.unit_type,
                   u.listing_description,
                   u.available_from,
                   CONCAT(lu.first_name, ' ', lu.last_name) AS landlord_name,
                   p.is_verified AS verified_property,
                   po.kyc_status AS owner_kyc,
                   u.auto_recommend,
                   u.promoted,
                   (SELECT pi.storage_key
                    FROM tbl_property_image pi
                    WHERE pi.property_id = p.id
                      AND pi.unit_type = u.unit_type
                      AND pi.unit_id IS NULL
                      AND pi.deleted_at IS NULL
                    ORDER BY pi.is_primary DESC, pi.sort_order ASC
                    LIMIT 1) AS type_cover_key,
                   (SELECT pi.storage_key
                    FROM tbl_property_image pi
                    WHERE pi.property_id = p.id
                      AND pi.unit_id IS NULL
                      AND pi.unit_type IS NULL
                      AND pi.deleted_at IS NULL
                    ORDER BY pi.is_primary DESC, pi.sort_order ASC
                    LIMIT 1) AS property_cover_key
            FROM tbl_property_unit u
            JOIN tbl_properties p ON u.property_id = p.id
            JOIN tbl_property_owner po ON p.owner_id = po.id
            JOIN tbl_users lu ON po.user_id = lu.id
            WHERE u.status = 'VACANT'
              AND u.discoverable = TRUE
              AND p.house_hunt_enabled = TRUE
              AND p.is_verified = TRUE
              AND po.kyc_status IN ('APPROVED', 'VERIFIED')
              AND u.deleted_at IS NULL
              AND p.deleted_at IS NULL
            """;

    private static final String BASE_PROPERTY_CATALOG_SQL = """
            SELECT p.id AS property_id,
                   p.name AS property_name,
                   p.description,
                   p.address,
                   p.city,
                   p.county,
                   COUNT(u.id) AS available_units,
                   MIN(u.rent) AS min_rent,
                   MAX(u.rent) AS max_rent,
                   BOOL_OR(u.promoted) AS promoted,
                   p.is_verified AS verified_property,
                   po.kyc_status AS owner_kyc,
                   CONCAT(lu.first_name, ' ', lu.last_name) AS landlord_name,
                   (SELECT pi.storage_key
                    FROM tbl_property_image pi
                    WHERE pi.property_id = p.id
                      AND pi.unit_id IS NULL
                      AND pi.unit_type IS NULL
                      AND pi.deleted_at IS NULL
                    ORDER BY pi.is_primary DESC, pi.sort_order ASC
                    LIMIT 1) AS cover_key
            FROM tbl_property_unit u
            JOIN tbl_properties p ON u.property_id = p.id
            JOIN tbl_property_owner po ON p.owner_id = po.id
            JOIN tbl_users lu ON po.user_id = lu.id
            WHERE u.status = 'VACANT'
              AND u.discoverable = TRUE
              AND p.house_hunt_enabled = TRUE
              AND p.is_verified = TRUE
              AND po.kyc_status IN ('APPROVED', 'VERIFIED')
              AND u.deleted_at IS NULL
              AND p.deleted_at IS NULL
            """;

    private final EntityManager entityManager;

    @Transactional(readOnly = true)
    public List<ListingResponse> searchListings(String queryText, String county, String city,
                                                Double minRent, Double maxRent, Integer minBedrooms,
                                                Set<Long> savedUnitIds) {
        StringBuilder sql = new StringBuilder(BASE_CATALOG_SQL);
        Map<String, Object> params = new HashMap<>();

        if (county != null && !county.isBlank()) {
            sql.append(" AND LOWER(p.county) LIKE LOWER(:county)");
            params.put("county", "%" + county.trim() + "%");
        }
        if (city != null && !city.isBlank()) {
            sql.append(" AND LOWER(p.city) LIKE LOWER(:city)");
            params.put("city", "%" + city.trim() + "%");
        }
        if (minRent != null) {
            sql.append(" AND u.rent >= :minRent");
            params.put("minRent", minRent);
        }
        if (maxRent != null) {
            sql.append(" AND u.rent <= :maxRent");
            params.put("maxRent", maxRent);
        }
        if (minBedrooms != null) {
            sql.append(" AND u.bedrooms >= :minBedrooms");
            params.put("minBedrooms", minBedrooms);
        }
        if (queryText != null && !queryText.isBlank()) {
            sql.append("""
                     AND (
                       LOWER(p.name) LIKE LOWER(:q)
                       OR LOWER(p.address) LIKE LOWER(:q)
                       OR LOWER(u.unit_number) LIKE LOWER(:q)
                       OR LOWER(u.listing_description) LIKE LOWER(:q)
                     )
                    """);
            params.put("q", "%" + queryText.trim() + "%");
        }

        sql.append(" ORDER BY u.promoted DESC, u.rent ASC");

        Query query = entityManager.createNativeQuery(sql.toString());
        params.forEach(query::setParameter);

        @SuppressWarnings("unchecked")
        List<Object[]> rows = query.getResultList();
        List<ListingResponse> listings = new ArrayList<>();
        for (Object[] row : rows) {
            listings.add(mapRow(row, savedUnitIds));
        }
        return listings;
    }

    @Transactional(readOnly = true)
    public ListingResponse getListing(Long unitId, Set<Long> savedUnitIds) {
        String sql = BASE_CATALOG_SQL + " AND u.id = :unitId";
        Query query = entityManager.createNativeQuery(sql);
        query.setParameter("unitId", unitId);

        @SuppressWarnings("unchecked")
        List<Object[]> rows = query.getResultList();
        if (rows.isEmpty()) {
            throw new ResourceNotFoundException("Listing not found or not available");
        }
        ListingResponse listing = mapRow(rows.getFirst(), savedUnitIds);
        String unitType = listing.getUnitType();
        listing.setImageUrls(loadGalleryImageUrls(listing.getPropertyId(), unitType));
        return listing;
    }

    @Transactional(readOnly = true)
    public List<ListingResponse> listAutoRecommendCandidates(Set<Long> savedUnitIds) {
        String sql = BASE_CATALOG_SQL
                + " AND u.auto_recommend = TRUE AND p.auto_recommend_enabled = TRUE"
                + " ORDER BY u.promoted DESC, u.rent ASC";
        Query query = entityManager.createNativeQuery(sql);

        @SuppressWarnings("unchecked")
        List<Object[]> rows = query.getResultList();
        List<ListingResponse> listings = new ArrayList<>();
        for (Object[] row : rows) {
            listings.add(mapRow(row, savedUnitIds));
        }
        return listings;
    }

    @Transactional(readOnly = true)
    public List<PropertyListingResponse> searchProperties(String queryText, String county, String city,
                                                          Double minRent, Double maxRent, Integer minBedrooms,
                                                          Set<Long> savedUnitIds) {
        StringBuilder sql = new StringBuilder(BASE_PROPERTY_CATALOG_SQL);
        Map<String, Object> params = new HashMap<>();
        appendPropertyFilters(sql, params, queryText, county, city, minRent, maxRent, minBedrooms);
        sql.append("""
                 GROUP BY p.id, p.name, p.description, p.address, p.city, p.county,
                          p.is_verified, po.kyc_status, lu.first_name, lu.last_name
                 ORDER BY promoted DESC, min_rent ASC
                """);

        Query query = entityManager.createNativeQuery(sql.toString());
        params.forEach(query::setParameter);

        @SuppressWarnings("unchecked")
        List<Object[]> rows = query.getResultList();
        List<PropertyListingResponse> listings = new ArrayList<>();
        for (Object[] row : rows) {
            listings.add(mapPropertyRow(row, savedUnitIds));
        }
        return listings;
    }

    @Transactional(readOnly = true)
    public PropertyListingDetailResponse getPropertyListing(Long propertyId, Set<Long> savedUnitIds) {
        String sql = BASE_PROPERTY_CATALOG_SQL
                + " AND p.id = :propertyId GROUP BY p.id, p.name, p.description, p.address, p.city, p.county, p.is_verified, po.kyc_status, lu.first_name, lu.last_name";
        Query query = entityManager.createNativeQuery(sql);
        query.setParameter("propertyId", propertyId);

        @SuppressWarnings("unchecked")
        List<Object[]> rows = query.getResultList();
        if (rows.isEmpty()) {
            throw new ResourceNotFoundException("Property listing not found or not available");
        }

        Object[] row = rows.getFirst();
        Long resolvedPropertyId = ((Number) row[0]).longValue();
        List<UnitTypeBreakdown> unitTypes = loadUnitTypeBreakdown(resolvedPropertyId);
        List<AvailableUnitResponse> units = loadAvailableUnits(resolvedPropertyId, savedUnitIds);
        String coverKey = stringValue(row[13]);
        boolean verifiedLandlord = row[11] != null
                && ("APPROVED".equalsIgnoreCase(String.valueOf(row[11]))
                || "VERIFIED".equalsIgnoreCase(String.valueOf(row[11])));

        return PropertyListingDetailResponse.builder()
                .propertyId(resolvedPropertyId)
                .propertyName(stringValue(row[1]))
                .description(stringValue(row[2]))
                .address(stringValue(row[3]))
                .city(stringValue(row[4]))
                .county(stringValue(row[5]))
                .availableUnits(row[6] != null ? ((Number) row[6]).intValue() : 0)
                .minRent(row[7] != null ? ((Number) row[7]).doubleValue() : null)
                .maxRent(row[8] != null ? ((Number) row[8]).doubleValue() : null)
                .promoted(booleanValue(row[9]))
                .verifiedProperty(booleanValue(row[10]))
                .verifiedLandlord(verifiedLandlord)
                .landlordName(stringValue(row[12]))
                .coverImageUrl(coverKey != null ? MEDIA_PREFIX + coverKey : null)
                .imageUrls(loadOverviewImageUrls(resolvedPropertyId))
                .unitTypes(unitTypes)
                .units(units)
                .build();
    }

    @Transactional(readOnly = true)
    public List<PropertyListingResponse> listAutoRecommendPropertyCandidates(Set<Long> savedUnitIds) {
        String sql = BASE_PROPERTY_CATALOG_SQL
                + " AND u.auto_recommend = TRUE AND p.auto_recommend_enabled = TRUE"
                + " GROUP BY p.id, p.name, p.description, p.address, p.city, p.county, p.is_verified, po.kyc_status, lu.first_name, lu.last_name"
                + " ORDER BY promoted DESC, min_rent ASC";
        Query query = entityManager.createNativeQuery(sql);

        @SuppressWarnings("unchecked")
        List<Object[]> rows = query.getResultList();
        List<PropertyListingResponse> listings = new ArrayList<>();
        for (Object[] row : rows) {
            listings.add(mapPropertyRow(row, savedUnitIds));
        }
        return listings;
    }

    private void appendPropertyFilters(StringBuilder sql, Map<String, Object> params,
                                       String queryText, String county, String city,
                                       Double minRent, Double maxRent, Integer minBedrooms) {
        if (county != null && !county.isBlank()) {
            sql.append(" AND LOWER(p.county) LIKE LOWER(:county)");
            params.put("county", "%" + county.trim() + "%");
        }
        if (city != null && !city.isBlank()) {
            sql.append(" AND LOWER(p.city) LIKE LOWER(:city)");
            params.put("city", "%" + city.trim() + "%");
        }
        if (minRent != null) {
            sql.append(" AND u.rent >= :minRent");
            params.put("minRent", minRent);
        }
        if (maxRent != null) {
            sql.append(" AND u.rent <= :maxRent");
            params.put("maxRent", maxRent);
        }
        if (minBedrooms != null) {
            sql.append(" AND u.bedrooms >= :minBedrooms");
            params.put("minBedrooms", minBedrooms);
        }
        if (queryText != null && !queryText.isBlank()) {
            sql.append("""
                     AND (
                       LOWER(p.name) LIKE LOWER(:q)
                       OR LOWER(p.address) LIKE LOWER(:q)
                       OR LOWER(p.city) LIKE LOWER(:q)
                       OR LOWER(p.county) LIKE LOWER(:q)
                     )
                    """);
            params.put("q", "%" + queryText.trim() + "%");
        }
    }

    private PropertyListingResponse mapPropertyRow(Object[] row, Set<Long> savedUnitIds) {
        Long propertyId = ((Number) row[0]).longValue();
        String coverKey = stringValue(row[13]);
        boolean verifiedLandlord = row[11] != null
                && ("APPROVED".equalsIgnoreCase(String.valueOf(row[11]))
                || "VERIFIED".equalsIgnoreCase(String.valueOf(row[11])));

        List<UnitTypeBreakdown> unitTypes = loadUnitTypeBreakdown(propertyId);
        boolean saved = savedUnitIds != null && hasSavedUnitInProperty(propertyId, savedUnitIds);

        return PropertyListingResponse.builder()
                .propertyId(propertyId)
                .propertyName(stringValue(row[1]))
                .description(stringValue(row[2]))
                .address(stringValue(row[3]))
                .city(stringValue(row[4]))
                .county(stringValue(row[5]))
                .availableUnits(row[6] != null ? ((Number) row[6]).intValue() : 0)
                .minRent(row[7] != null ? ((Number) row[7]).doubleValue() : null)
                .maxRent(row[8] != null ? ((Number) row[8]).doubleValue() : null)
                .promoted(booleanValue(row[9]))
                .verifiedProperty(booleanValue(row[10]))
                .verifiedLandlord(verifiedLandlord)
                .coverImageUrl(coverKey != null ? MEDIA_PREFIX + coverKey : null)
                .imageUrls(loadOverviewImageUrls(propertyId))
                .unitTypes(unitTypes)
                .saved(saved)
                .build();
    }

    private boolean hasSavedUnitInProperty(Long propertyId, Set<Long> savedUnitIds) {
        if (savedUnitIds == null || savedUnitIds.isEmpty()) {
            return false;
        }
        String sql = """
                SELECT COUNT(*)
                FROM tbl_property_unit
                WHERE property_id = :propertyId
                  AND id IN (:unitIds)
                  AND deleted_at IS NULL
                """;
        Query query = entityManager.createNativeQuery(sql);
        query.setParameter("propertyId", propertyId);
        query.setParameter("unitIds", savedUnitIds);
        Number count = (Number) query.getSingleResult();
        return count.intValue() > 0;
    }

    private List<UnitTypeBreakdown> loadUnitTypeBreakdown(Long propertyId) {
        String sql = """
                SELECT u.unit_type,
                       COUNT(*) AS available_count,
                       MIN(u.rent) AS min_rent,
                       MAX(u.rent) AS max_rent
                FROM tbl_property_unit u
                JOIN tbl_properties p ON u.property_id = p.id
                WHERE u.property_id = :propertyId
                  AND u.status = 'VACANT'
                  AND u.discoverable = TRUE
                  AND p.house_hunt_enabled = TRUE
                  AND u.deleted_at IS NULL
                GROUP BY u.unit_type
                ORDER BY min_rent ASC
                """;
        Query query = entityManager.createNativeQuery(sql);
        query.setParameter("propertyId", propertyId);

        @SuppressWarnings("unchecked")
        List<Object[]> rows = query.getResultList();
        List<UnitTypeBreakdown> breakdown = new ArrayList<>();
        for (Object[] row : rows) {
            String unitType = row[0] != null ? String.valueOf(row[0]) : "OTHER";
            breakdown.add(UnitTypeBreakdown.builder()
                    .unitType(unitType)
                    .label(formatUnitTypeLabel(unitType))
                    .availableCount(row[1] != null ? ((Number) row[1]).intValue() : 0)
                    .minRent(row[2] != null ? ((Number) row[2]).doubleValue() : null)
                    .maxRent(row[3] != null ? ((Number) row[3]).doubleValue() : null)
                    .sampleImageUrl(loadUnitTypeSampleUrl(propertyId, unitType))
                    .imageUrls(loadUnitTypeImageUrls(propertyId, unitType))
                    .build());
        }
        return breakdown;
    }

    private List<AvailableUnitResponse> loadAvailableUnits(Long propertyId, Set<Long> savedUnitIds) {
        String sql = """
                SELECT u.id, u.unit_number, u.floor_number, u.wing, u.unit_type,
                       u.bedrooms, u.bathrooms, u.rent, u.deposit, u.listing_description,
                       u.available_from, u.promoted
                FROM tbl_property_unit u
                JOIN tbl_properties p ON u.property_id = p.id
                WHERE u.property_id = :propertyId
                  AND u.status = 'VACANT'
                  AND u.discoverable = TRUE
                  AND p.house_hunt_enabled = TRUE
                  AND u.deleted_at IS NULL
                ORDER BY u.floor_number NULLS LAST, u.unit_number ASC
                """;
        Query query = entityManager.createNativeQuery(sql);
        query.setParameter("propertyId", propertyId);

        @SuppressWarnings("unchecked")
        List<Object[]> rows = query.getResultList();
        List<AvailableUnitResponse> units = new ArrayList<>();
        for (Object[] row : rows) {
            Long unitId = ((Number) row[0]).longValue();
            String unitType = row[4] != null ? String.valueOf(row[4]) : null;
            units.add(AvailableUnitResponse.builder()
                    .unitId(unitId)
                    .unitNumber(stringValue(row[1]))
                    .floorNumber(row[2] != null ? ((Number) row[2]).intValue() : null)
                    .wing(stringValue(row[3]))
                    .unitType(unitType)
                    .unitTypeLabel(formatUnitTypeLabel(unitType))
                    .bedrooms(row[5] != null ? ((Number) row[5]).intValue() : null)
                    .bathrooms(row[6] != null ? ((Number) row[6]).intValue() : null)
                    .rent(row[7] != null ? ((Number) row[7]).doubleValue() : null)
                    .deposit(row[8] != null ? ((Number) row[8]).doubleValue() : null)
                    .listingDescription(stringValue(row[9]))
                    .availableFrom(parseDate(row[10]))
                    .promoted(booleanValue(row[11]))
                    .saved(savedUnitIds != null && savedUnitIds.contains(unitId))
                    .sampleImageUrl(loadUnitTypeSampleUrl(propertyId, unitType))
                    .build());
        }
        return units;
    }

    private List<String> loadOverviewImageUrls(Long propertyId) {
        String sql = """
                SELECT storage_key
                FROM tbl_property_image
                WHERE property_id = :propertyId
                  AND deleted_at IS NULL
                  AND unit_id IS NULL
                  AND unit_type IS NULL
                ORDER BY is_primary DESC, sort_order ASC
                """;
        Query query = entityManager.createNativeQuery(sql);
        query.setParameter("propertyId", propertyId);
        return mapStorageKeys(query.getResultList());
    }

    private String loadUnitTypeSampleUrl(Long propertyId, String unitType) {
        List<String> urls = loadUnitTypeImageUrls(propertyId, unitType);
        return urls.isEmpty() ? null : urls.getFirst();
    }

    private List<String> loadUnitTypeImageUrls(Long propertyId, String unitType) {
        if (unitType == null || unitType.isBlank()) {
            return List.of();
        }
        String sql = """
                SELECT storage_key
                FROM tbl_property_image
                WHERE property_id = :propertyId
                  AND deleted_at IS NULL
                  AND unit_id IS NULL
                  AND unit_type = :unitType
                ORDER BY is_primary DESC, sort_order ASC
                """;
        Query query = entityManager.createNativeQuery(sql);
        query.setParameter("propertyId", propertyId);
        query.setParameter("unitType", unitType);
        return mapStorageKeys(query.getResultList());
    }

    private List<String> mapStorageKeys(List<?> rows) {
        List<String> urls = new ArrayList<>();
        for (Object row : rows) {
            String key = stringValue(row);
            if (key != null && !key.isBlank()) {
                urls.add(MEDIA_PREFIX + key);
            }
        }
        return urls;
    }

    private String formatUnitTypeLabel(String unitType) {
        if (unitType == null || unitType.isBlank()) {
            return "Unit";
        }
        String[] parts = unitType.replace('_', ' ').toLowerCase().split("\\s+");
        StringBuilder label = new StringBuilder();
        for (String part : parts) {
            if (!part.isEmpty()) {
                label.append(Character.toUpperCase(part.charAt(0))).append(part.substring(1)).append(' ');
            }
        }
        return label.toString().trim();
    }

    private ListingResponse mapRow(Object[] row, Set<Long> savedUnitIds) {
        Long unitId = ((Number) row[0]).longValue();
        LocalDate availableFrom = parseDate(row[13]);

        boolean verifiedLandlord = row[16] != null
                && ("APPROVED".equalsIgnoreCase(String.valueOf(row[16]))
                || "VERIFIED".equalsIgnoreCase(String.valueOf(row[16])));

        String coverKey = stringValue(row[19]);
        if (coverKey == null || coverKey.isBlank()) {
            coverKey = stringValue(row[20]);
        }

        return ListingResponse.builder()
                .unitId(unitId)
                .propertyId(((Number) row[1]).longValue())
                .propertyName(stringValue(row[2]))
                .unitNumber(stringValue(row[3]))
                .address(stringValue(row[4]))
                .city(stringValue(row[5]))
                .county(stringValue(row[6]))
                .rent(row[7] != null ? ((Number) row[7]).doubleValue() : null)
                .deposit(row[8] != null ? ((Number) row[8]).doubleValue() : null)
                .bedrooms(row[9] != null ? ((Number) row[9]).intValue() : null)
                .bathrooms(row[10] != null ? ((Number) row[10]).intValue() : null)
                .unitType(row[11] != null ? String.valueOf(row[11]) : null)
                .listingDescription(stringValue(row[12]))
                .availableFrom(availableFrom)
                .landlordName(stringValue(row[14]))
                .verifiedProperty(booleanValue(row[15]))
                .verifiedLandlord(verifiedLandlord)
                .autoRecommend(booleanValue(row[17]))
                .promoted(booleanValue(row[18]))
                .coverImageUrl(coverKey != null ? MEDIA_PREFIX + coverKey : null)
                .saved(savedUnitIds != null && savedUnitIds.contains(unitId))
                .build();
    }

    private List<String> loadGalleryImageUrls(Long propertyId, String unitType) {
        List<String> urls = new ArrayList<>(loadOverviewImageUrls(propertyId));
        String sampleUrl = loadUnitTypeSampleUrl(propertyId, unitType);
        if (sampleUrl != null) {
            urls.add(sampleUrl);
        }
        return urls;
    }

    private LocalDate parseDate(Object value) {
        if (value == null) {
            return null;
        }
        if (value instanceof Date sqlDate) {
            return sqlDate.toLocalDate();
        }
        if (value instanceof LocalDate localDate) {
            return localDate;
        }
        return null;
    }

    private String stringValue(Object value) {
        return value != null ? String.valueOf(value).trim() : null;
    }

    private boolean booleanValue(Object value) {
        if (value == null) {
            return false;
        }
        if (value instanceof Boolean b) {
            return b;
        }
        if (value instanceof Number n) {
            return n.intValue() != 0;
        }
        return Boolean.parseBoolean(String.valueOf(value));
    }
}

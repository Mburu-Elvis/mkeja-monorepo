package co.ke.mkeja.onboarding.service;

import co.ke.mkeja.onboarding.dto.response.*;
import co.ke.mkeja.onboarding.model.entity.*;
import co.ke.mkeja.onboarding.model.enums.*;
import co.ke.mkeja.onboarding.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AdminMetricsService {

    private static final DateTimeFormatter MONTH_LABEL = DateTimeFormatter.ofPattern("MMM yyyy", Locale.ENGLISH);
    private static final DateTimeFormatter SHORT_MONTH = DateTimeFormatter.ofPattern("MMM", Locale.ENGLISH);

    private final UserRepository userRepository;
    private final PropertyRepository propertyRepository;
    private final PropertyUnitRepository propertyUnitRepository;
    private final TenancyRepository tenancyRepository;
    private final SecurityDepositRepository securityDepositRepository;
    private final StandingOrderRepository standingOrderRepository;
    private final TenantInvitationRepository invitationRepository;
    private final RoleService roleService;

    @Transactional(readOnly = true)
    public AdminFinancialMetrics computeFinancialMetrics() {
        double monthlyRentRoll = tenancyRepository.sumMonthlyRentByStatus(TenancyStatus.ACTIVE);

        List<SecurityDeposit> deposits = securityDepositRepository.findAll();
        double totalDeposits = deposits.stream()
                .map(SecurityDeposit::getAmount)
                .filter(a -> a != null)
                .mapToDouble(Double::doubleValue)
                .sum();
        long depositsPending = deposits.stream()
                .filter(d -> d.getStatus() == KycStatus.PENDING || d.getStatus() == KycStatus.MANUAL_REVIEW)
                .count();
        long depositsApproved = deposits.stream()
                .filter(d -> d.getStatus() == KycStatus.APPROVED || d.getStatus() == KycStatus.VERIFIED)
                .count();

        List<StandingOrder> orders = standingOrderRepository.findAll();
        long activeOrders = orders.stream().filter(o -> o.getStatus() == StandingOrderStatus.ACTIVE).count();
        long pendingOrders = orders.stream().filter(o -> o.getStatus() == StandingOrderStatus.PENDING).count();
        double orderVolume = orders.stream()
                .filter(o -> o.getStatus() == StandingOrderStatus.ACTIVE)
                .map(StandingOrder::getAmount)
                .filter(a -> a != null)
                .mapToDouble(Double::doubleValue)
                .sum();

        return AdminFinancialMetrics.builder()
                .monthlyRentRoll(monthlyRentRoll)
                .totalSecurityDeposits(totalDeposits)
                .securityDepositsPending(depositsPending)
                .securityDepositsApproved(depositsApproved)
                .activeStandingOrders(activeOrders)
                .pendingStandingOrders(pendingOrders)
                .standingOrderVolume(orderVolume)
                .estimatedMonthlyVolume(monthlyRentRoll + orderVolume)
                .build();
    }

    @Transactional(readOnly = true)
    public AdminBusinessMetrics computeBusinessMetrics() {
        List<Property> properties = propertyRepository.findAllByDeletedAtIsNull();
        long verified = properties.stream().filter(p -> p.getPropertyStatus() == PropertyStatus.VERIFIED).count();
        long pending = properties.stream().filter(p -> p.getPropertyStatus() == PropertyStatus.PENDING_VERIFICATION).count();

        List<PropertyUnit> units = propertyUnitRepository.findAll();
        long occupied = units.stream().filter(u -> u.getStatus() == UnitStatus.OCCUPIED).count();
        long vacant = units.stream().filter(u -> u.getStatus() == UnitStatus.VACANT).count();
        double occupancyRate = units.isEmpty() ? 0 : (occupied * 100.0 / units.size());

        LocalDateTime since = LocalDateTime.now().minusDays(30);
        long newUsers = userRepository.findAll().stream()
                .filter(u -> u.getCreatedAt() != null && u.getCreatedAt().isAfter(since))
                .count();
        long newLandlords = userRepository.findAll().stream()
                .filter(u -> roleService.isLandlord(u)
                        && u.getCreatedAt() != null && u.getCreatedAt().isAfter(since))
                .count();
        long newTenants = userRepository.findAll().stream()
                .filter(u -> roleService.isTenant(u)
                        && u.getCreatedAt() != null && u.getCreatedAt().isAfter(since))
                .count();
        long newProperties = properties.stream()
                .filter(p -> p.getCreatedAt() != null && p.getCreatedAt().isAfter(since))
                .count();

        long pendingInvites = invitationRepository.countPendingInvitations();

        return AdminBusinessMetrics.builder()
                .totalProperties(properties.size())
                .verifiedProperties(verified)
                .pendingProperties(pending)
                .totalUnits(units.size())
                .occupiedUnits(occupied)
                .vacantUnits(vacant)
                .pendingInvitations(pendingInvites)
                .newUsersLast30Days(newUsers)
                .newLandlordsLast30Days(newLandlords)
                .newTenantsLast30Days(newTenants)
                .newPropertiesLast30Days(newProperties)
                .occupancyRate(Math.round(occupancyRate * 10) / 10.0)
                .build();
    }

    @Transactional(readOnly = true)
    public AdminOperationalMetrics computeOperationalMetrics() {
        List<User> users = userRepository.findAll();
        long suspended = users.stream().filter(u -> !u.isActive()).count();
        long locked = users.stream().filter(User::isLocked).count();
        long pendingTenancies = tenancyRepository.countByStatus(TenancyStatus.PENDING);
        long failedOrders = standingOrderRepository.findAll().stream()
                .filter(o -> o.getStatus() == StandingOrderStatus.FAILED)
                .count();

        return AdminOperationalMetrics.builder()
                .suspendedUsers(suspended)
                .lockedUsers(locked)
                .pendingTenancies(pendingTenancies)
                .failedStandingOrders(failedOrders)
                .totalInvitations(invitationRepository.count())
                .build();
    }

    @Transactional(readOnly = true)
    public List<AdminGrowthDataPoint> computeGrowthTrend(int months) {
        List<AdminGrowthDataPoint> points = new ArrayList<>();
        YearMonth current = YearMonth.now();

        for (int i = months - 1; i >= 0; i--) {
            YearMonth ym = current.minusMonths(i);
            LocalDateTime start = ym.atDay(1).atStartOfDay();
            LocalDateTime end = ym.plusMonths(1).atDay(1).atStartOfDay();

            List<User> monthUsers = userRepository.findAll().stream()
                    .filter(u -> isInRange(u.getCreatedAt(), start, end))
                    .toList();
            long landlords = monthUsers.stream().filter(roleService::isLandlord).count();
            long tenants = monthUsers.stream().filter(roleService::isTenant).count();
            long properties = propertyRepository.findAllByDeletedAtIsNull().stream()
                    .filter(p -> isInRange(p.getCreatedAt(), start, end))
                    .count();
            double rentRoll = tenancyRepository.sumMonthlyRentByStatusCreatedBetween(
                    TenancyStatus.ACTIVE, start, end);

            points.add(AdminGrowthDataPoint.builder()
                    .period(ym.format(MONTH_LABEL))
                    .shortLabel(ym.format(SHORT_MONTH))
                    .users(monthUsers.size())
                    .landlords(landlords)
                    .tenants(tenants)
                    .properties(properties)
                    .rentRoll(rentRoll)
                    .build());
        }
        return points;
    }

    @Transactional(readOnly = true)
    public List<AdminLedgerEntryResponse> listLedgerEntries(String type, String search,
                                                            LocalDate startDate, LocalDate endDate) {
        List<AdminLedgerEntryResponse> entries = new ArrayList<>();

        for (SecurityDeposit deposit : securityDepositRepository.findAll()) {
            entries.add(toDepositEntry(deposit));
        }
        for (StandingOrder order : standingOrderRepository.findAll()) {
            entries.add(toStandingOrderEntry(order));
        }

        return entries.stream()
                .filter(e -> matchesType(e, type))
                .filter(e -> matchesSearch(e, search))
                .filter(e -> matchesDateRange(e, startDate, endDate))
                .sorted(Comparator.comparing(AdminLedgerEntryResponse::getTimestamp,
                        Comparator.nullsLast(Comparator.reverseOrder())))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public AdminDailyReportResponse getDailyReport(LocalDate date) {
        LocalDateTime start = date.atStartOfDay();
        LocalDateTime end = date.plusDays(1).atStartOfDay();

        List<User> users = userRepository.findAll().stream()
                .filter(u -> isInRange(u.getCreatedAt(), start, end))
                .toList();
        long landlords = users.stream().filter(roleService::isLandlord).count();
        long tenants = users.stream().filter(roleService::isTenant).count();
        long properties = propertyRepository.findAllByDeletedAtIsNull().stream()
                .filter(p -> isInRange(p.getCreatedAt(), start, end))
                .count();
        long tenancies = tenancyRepository.findAll().stream()
                .filter(t -> isInRange(t.getCreatedAt(), start, end))
                .count();

        List<SecurityDeposit> dayDeposits = securityDepositRepository.findAll().stream()
                .filter(d -> isInRange(d.getCreatedAt(), start, end))
                .toList();
        double depositAmount = dayDeposits.stream()
                .map(SecurityDeposit::getAmount)
                .filter(a -> a != null)
                .mapToDouble(Double::doubleValue)
                .sum();

        List<StandingOrder> dayOrders = standingOrderRepository.findAll().stream()
                .filter(o -> isInRange(o.getCreatedAt(), start, end))
                .toList();
        double orderAmount = dayOrders.stream()
                .map(StandingOrder::getAmount)
                .filter(a -> a != null)
                .mapToDouble(Double::doubleValue)
                .sum();

        List<AdminLedgerEntryResponse> dayLedger = listLedgerEntries(null, null, date, date);
        double ledgerVolume = dayLedger.stream().mapToDouble(AdminLedgerEntryResponse::getAmount).sum();

        AdminFinancialMetrics financial = computeFinancialMetrics();

        return AdminDailyReportResponse.builder()
                .date(date.toString())
                .newUsers(users.size())
                .newTenants(tenants)
                .newLandlords(landlords)
                .newProperties(properties)
                .newTenancies(tenancies)
                .securityDeposits(dayDeposits.size())
                .securityDepositAmount(depositAmount)
                .standingOrders(dayOrders.size())
                .standingOrderAmount(orderAmount)
                .rentRollActive(financial.getMonthlyRentRoll())
                .ledgerEntries(dayLedger.size())
                .ledgerVolume(ledgerVolume)
                .dataSource("onboarding")
                .build();
    }

    @Transactional(readOnly = true)
    public AdminMonthlyReportResponse getMonthlyReport(int year, int month) {
        YearMonth ym = YearMonth.of(year, month);
        LocalDateTime start = ym.atDay(1).atStartOfDay();
        LocalDateTime end = ym.plusMonths(1).atDay(1).atStartOfDay();

        List<User> users = userRepository.findAll().stream()
                .filter(u -> isInRange(u.getCreatedAt(), start, end))
                .toList();
        long landlords = users.stream().filter(roleService::isLandlord).count();
        long tenants = users.stream().filter(roleService::isTenant).count();
        long properties = propertyRepository.findAllByDeletedAtIsNull().stream()
                .filter(p -> isInRange(p.getCreatedAt(), start, end))
                .count();
        long tenancies = tenancyRepository.findAll().stream()
                .filter(t -> isInRange(t.getCreatedAt(), start, end))
                .count();

        List<SecurityDeposit> monthDeposits = securityDepositRepository.findAll().stream()
                .filter(d -> isInRange(d.getCreatedAt(), start, end))
                .toList();
        double depositAmount = monthDeposits.stream()
                .map(SecurityDeposit::getAmount)
                .filter(a -> a != null)
                .mapToDouble(Double::doubleValue)
                .sum();

        List<StandingOrder> monthOrders = standingOrderRepository.findAll().stream()
                .filter(o -> isInRange(o.getCreatedAt(), start, end))
                .toList();
        double orderAmount = monthOrders.stream()
                .map(StandingOrder::getAmount)
                .filter(a -> a != null)
                .mapToDouble(Double::doubleValue)
                .sum();

        AdminFinancialMetrics financial = computeFinancialMetrics();
        long activeTenancies = tenancyRepository.countByStatus(TenancyStatus.ACTIVE);
        long activeLandlords = roleService.countUsersWithRole(RoleName.PROPERTY_OWNER);
        long activeTenants = roleService.countUsersWithRole(RoleName.TENANT);

        List<AdminGrowthDataPoint> dailyBreakdown = new ArrayList<>();
        for (int day = 1; day <= ym.lengthOfMonth(); day++) {
            LocalDate d = ym.atDay(day);
            AdminDailyReportResponse daily = getDailyReport(d);
            dailyBreakdown.add(AdminGrowthDataPoint.builder()
                    .period(d.toString())
                    .shortLabel(String.valueOf(day))
                    .users(daily.getNewUsers())
                    .landlords(daily.getNewLandlords())
                    .tenants(daily.getNewTenants())
                    .properties(daily.getNewProperties())
                    .rentRoll(daily.getLedgerVolume())
                    .build());
        }

        return AdminMonthlyReportResponse.builder()
                .year(year)
                .month(month)
                .monthLabel(ym.format(MONTH_LABEL))
                .newUsers(users.size())
                .newTenants(tenants)
                .newLandlords(landlords)
                .newProperties(properties)
                .newTenancies(tenancies)
                .securityDeposits(monthDeposits.size())
                .securityDepositAmount(depositAmount)
                .standingOrders(monthOrders.size())
                .standingOrderAmount(orderAmount)
                .rentRollEndOfMonth(financial.getMonthlyRentRoll())
                .activeTenancies(activeTenancies)
                .activeLandlords(activeLandlords)
                .activeTenants(activeTenants)
                .dailyBreakdown(dailyBreakdown)
                .dataSource("onboarding")
                .build();
    }

    private AdminLedgerEntryResponse toDepositEntry(SecurityDeposit deposit) {
        String tenantName = deposit.getTenant() != null && deposit.getTenant().getUser() != null
                ? deposit.getTenant().getUser().getFullName() : "Unknown";
        String status = mapDepositStatus(deposit.getStatus());
        return AdminLedgerEntryResponse.builder()
                .id("dep-" + deposit.getId())
                .timestamp(deposit.getCreatedAt())
                .type("SECURITY_DEPOSIT")
                .amount(deposit.getAmount() != null ? deposit.getAmount() : 0)
                .direction("CREDIT")
                .tenantName(tenantName)
                .reference(deposit.getStkRef() != null ? deposit.getStkRef() : "DEP-" + deposit.getId())
                .status(status)
                .source("onboarding")
                .build();
    }

    private AdminLedgerEntryResponse toStandingOrderEntry(StandingOrder order) {
        String tenantName = order.getTenant() != null && order.getTenant().getUser() != null
                ? order.getTenant().getUser().getFullName() : "Unknown";
        return AdminLedgerEntryResponse.builder()
                .id("so-" + order.getId())
                .timestamp(order.getCreatedAt())
                .type("STANDING_ORDER")
                .amount(order.getAmount() != null ? order.getAmount() : 0)
                .direction("DEBIT")
                .tenantName(tenantName)
                .reference(order.getExternalRef() != null ? order.getExternalRef() : "RATIBA-" + order.getId())
                .status(mapOrderStatus(order.getStatus()))
                .source("onboarding")
                .build();
    }

    private String mapDepositStatus(KycStatus status) {
        if (status == null) return "pending";
        return switch (status) {
            case APPROVED, VERIFIED -> "completed";
            case REJECTED -> "failed";
            case MANUAL_REVIEW -> "pending";
            default -> "pending";
        };
    }

    private String mapOrderStatus(StandingOrderStatus status) {
        if (status == null) return "pending";
        return switch (status) {
            case ACTIVE -> "completed";
            case FAILED, CANCELLED -> "failed";
            default -> "pending";
        };
    }

    private boolean isInRange(LocalDateTime value, LocalDateTime start, LocalDateTime end) {
        return value != null && !value.isBefore(start) && value.isBefore(end);
    }

    private boolean matchesType(AdminLedgerEntryResponse entry, String type) {
        if (type == null || type.isBlank() || "all".equalsIgnoreCase(type)) {
            return true;
        }
        return entry.getType().equalsIgnoreCase(type);
    }

    private boolean matchesSearch(AdminLedgerEntryResponse entry, String search) {
        if (search == null || search.isBlank()) {
            return true;
        }
        String term = search.toLowerCase(Locale.ROOT);
        return (entry.getTenantName() != null && entry.getTenantName().toLowerCase(Locale.ROOT).contains(term))
                || (entry.getReference() != null && entry.getReference().toLowerCase(Locale.ROOT).contains(term))
                || (entry.getType() != null && entry.getType().toLowerCase(Locale.ROOT).contains(term));
    }

    private boolean matchesDateRange(AdminLedgerEntryResponse entry, LocalDate start, LocalDate end) {
        if (entry.getTimestamp() == null) {
            return start == null && end == null;
        }
        LocalDate entryDate = entry.getTimestamp().toLocalDate();
        if (start != null && entryDate.isBefore(start)) {
            return false;
        }
        if (end != null && entryDate.isAfter(end)) {
            return false;
        }
        return true;
    }
}

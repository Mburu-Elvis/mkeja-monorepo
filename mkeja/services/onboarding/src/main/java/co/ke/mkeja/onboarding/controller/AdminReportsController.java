package co.ke.mkeja.onboarding.controller;

import co.ke.mkeja.onboarding.dto.response.*;
import co.ke.mkeja.onboarding.service.AdminDashboardService;
import co.ke.mkeja.onboarding.service.AdminMetricsService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/v1/admin/reports")
@RequiredArgsConstructor
public class AdminReportsController {

    private final AdminDashboardService adminDashboardService;
    private final AdminMetricsService adminMetricsService;

    @GetMapping("/overview")
    public AdminDashboardResponse overview() {
        return adminDashboardService.getDashboard();
    }

    @GetMapping("/ledger")
    public List<AdminLedgerEntryResponse> ledger(
            @RequestParam(required = false) String type,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        return adminMetricsService.listLedgerEntries(type, search, startDate, endDate);
    }

    @GetMapping("/daily")
    public AdminDailyReportResponse daily(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        LocalDate reportDate = date != null ? date : LocalDate.now();
        return adminMetricsService.getDailyReport(reportDate);
    }

    @GetMapping("/monthly")
    public AdminMonthlyReportResponse monthly(
            @RequestParam(required = false) Integer year,
            @RequestParam(required = false) Integer month) {
        LocalDate now = LocalDate.now();
        int y = year != null ? year : now.getYear();
        int m = month != null ? month : now.getMonthValue();
        return adminMetricsService.getMonthlyReport(y, m);
    }
}

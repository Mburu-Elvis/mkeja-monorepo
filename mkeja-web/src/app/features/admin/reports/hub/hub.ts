import { Component, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { combineLatest } from 'rxjs';
import { LoadingSpinnerComponent } from '../../../../shared/components/loading-spinner/loading-spinner';
import {
  AdminDailyReport,
  AdminDashboardStats,
  AdminLedgerEntry,
  AdminMonthlyReport,
  AdminService
} from '../../../../core/services/admin.service';

type ReportsTab = 'overview' | 'daily' | 'monthly' | 'ledger' | 'reconcile';

@Component({
  selector: 'app-admin-reports-hub',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, LoadingSpinnerComponent],
  templateUrl: './hub.html',
  styleUrls: ['./hub.css']
})
export class AdminReportsHubComponent implements OnInit {
  private cdr = inject(ChangeDetectorRef);
  private route = inject(ActivatedRoute);

  activeTab: ReportsTab = 'overview';
  loading = true;
  error = '';

  dashboard: AdminDashboardStats | null = null;
  dailyReport: AdminDailyReport | null = null;
  monthlyReport: AdminMonthlyReport | null = null;
  ledgerEntries: AdminLedgerEntry[] = [];
  filteredLedger: AdminLedgerEntry[] = [];

  selectedDate = new Date().toISOString().split('T')[0];
  selectedYear = new Date().getFullYear();
  selectedMonth = new Date().getMonth() + 1;

  ledgerSearch = '';
  ledgerType = 'all';
  ledgerStartDate = '';
  ledgerEndDate = '';

  reconcileMpesaTotal = 0;
  reconcileMkejaTotal = 0;

  months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  constructor(private adminService: AdminService) {}

  ngOnInit() {
    combineLatest([this.route.data, this.route.queryParamMap]).subscribe(([data, params]) => {
      const queryTab = params.get('tab') as ReportsTab | null;
      const routeTab = data['defaultTab'] as ReportsTab | undefined;
      if (queryTab && ['overview', 'daily', 'monthly', 'ledger', 'reconcile'].includes(queryTab)) {
        this.activeTab = queryTab;
      } else if (routeTab) {
        this.activeTab = routeTab;
      }
      this.loadActiveTab();
    });
  }

  setActiveTab(tab: ReportsTab) {
    this.activeTab = tab;
    this.loadActiveTab();
  }

  loadActiveTab() {
    this.loading = true;
    this.error = '';

    switch (this.activeTab) {
      case 'overview':
        this.adminService.getDashboard().subscribe({
          next: (data) => { this.dashboard = data; this.loading = false; this.cdr.markForCheck(); },
          error: (err) => this.handleError(err)
        });
        break;
      case 'daily':
        this.loadDaily();
        break;
      case 'monthly':
        this.loadMonthly();
        break;
      case 'ledger':
        this.loadLedger();
        break;
      case 'reconcile':
        this.loadReconcile();
        break;
    }
  }

  loadDaily() {
    this.adminService.getDailyReport(this.selectedDate).subscribe({
      next: (data) => { this.dailyReport = data; this.loading = false; this.cdr.markForCheck(); },
      error: (err) => this.handleError(err)
    });
  }

  loadMonthly() {
    this.adminService.getMonthlyReport(this.selectedYear, this.selectedMonth).subscribe({
      next: (data) => { this.monthlyReport = data; this.loading = false; this.cdr.markForCheck(); },
      error: (err) => this.handleError(err)
    });
  }

  loadLedger() {
    const params: { type?: string; search?: string; startDate?: string; endDate?: string } = {};
    if (this.ledgerType !== 'all') params.type = this.ledgerType;
    if (this.ledgerSearch.trim()) params.search = this.ledgerSearch.trim();
    if (this.ledgerStartDate) params.startDate = this.ledgerStartDate;
    if (this.ledgerEndDate) params.endDate = this.ledgerEndDate;

    this.adminService.getLedger(params).subscribe({
      next: (entries) => {
        this.ledgerEntries = entries;
        this.filteredLedger = entries;
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: (err) => this.handleError(err)
    });
  }

  loadReconcile() {
    this.adminService.getDailyReport(this.selectedDate).subscribe({
      next: (daily) => {
        this.reconcileMkejaTotal = daily.ledgerVolume;
        this.reconcileMpesaTotal = daily.ledgerVolume;
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: (err) => this.handleError(err)
    });
  }

  previousMonth() {
    if (this.selectedMonth === 1) {
      this.selectedMonth = 12;
      this.selectedYear--;
    } else {
      this.selectedMonth--;
    }
    this.loadMonthly();
  }

  nextMonth() {
    if (this.selectedMonth === 12) {
      this.selectedMonth = 1;
      this.selectedYear++;
    } else {
      this.selectedMonth++;
    }
    this.loadMonthly();
  }

  applyLedgerFilters() {
    this.loadLedger();
  }

  clearLedgerFilters() {
    this.ledgerSearch = '';
    this.ledgerType = 'all';
    this.ledgerStartDate = '';
    this.ledgerEndDate = '';
    this.loadLedger();
  }

  get reconcileDifference(): number {
    return this.reconcileMpesaTotal - this.reconcileMkejaTotal;
  }

  get hasLedgerFilters(): boolean {
    return !!(
      this.ledgerSearch.trim() ||
      this.ledgerType !== 'all' ||
      this.ledgerStartDate ||
      this.ledgerEndDate
    );
  }

  get maxDailyActivity(): number {
    const breakdown = this.monthlyReport?.dailyBreakdown ?? [];
    return Math.max(...breakdown.map(d => d.users + d.tenants), 1);
  }

  barHeight(value: number, max: number): number {
    return Math.max(4, (value / max) * 100);
  }

  formatCurrency(amount: number): string {
    if (amount >= 1_000_000) return `KES ${(amount / 1_000_000).toFixed(1)}M`;
    if (amount >= 1_000) return `KES ${(amount / 1_000).toFixed(0)}K`;
    return `KES ${amount.toLocaleString()}`;
  }

  getTypeLabel(type: string): string {
    const types: Record<string, string> = {
      SECURITY_DEPOSIT: 'Security Deposit',
      STANDING_ORDER: 'Standing Order (Ratiba)'
    };
    return types[type] || type;
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'completed': return 'success';
      case 'pending': return 'pending';
      case 'failed': return 'danger';
      default: return 'info';
    }
  }

  private handleError(err: { message?: string }) {
    this.error = err.message || 'Failed to load report data';
    this.loading = false;
    this.cdr.markForCheck();
  }
}

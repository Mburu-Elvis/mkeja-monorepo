import { Component, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { MatIconModule, MatIconRegistry } from '@angular/material/icon';
import { DomSanitizer } from '@angular/platform-browser';
import { MatSnackBar } from '@angular/material/snack-bar';
import { forkJoin, of, Observable } from 'rxjs';
import { catchError, finalize, map } from 'rxjs/operators';
import { AuthService, User } from '../../../../core/services/auth';
import {
  AdminDashboardStats,
  AdminGrowthDataPoint,
  AdminService,
  KycApplication
} from '../../../../core/services/admin.service';
import { PropertySummary } from '../../../../core/services/property.service';

type DashboardTab = 'overview' | 'business' | 'financials' | 'operations';

@Component({
  selector: 'app-admin-dashboard-main',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule],
  templateUrl: './main.html',
  styleUrls: ['./main.css']
})
export class AdminDashboardMainComponent implements OnInit {
  private iconRegistry = inject(MatIconRegistry);
  private sanitizer = inject(DomSanitizer);
  private cdr = inject(ChangeDetectorRef);

  loading = true;
  isRefreshing = false;
  verifyingPropertyId: number | null = null;
  currentUser: User | null = null;
  stats: AdminDashboardStats | null = null;
  error = '';
  activeTab: DashboardTab = 'overview';

  constructor(
    private adminService: AdminService,
    private authService: AuthService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {
    this.registerIcons();
  }

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    this.loadDashboard();
  }

  private registerIcons(): void {
    ['users', 'building', 'shield', 'refresh', 'check', 'barChart', 'banknote', 'alert', 'pieChart', 'activity'].forEach(icon => {
      this.iconRegistry.addSvgIconLiteral(icon, this.sanitizer.bypassSecurityTrustHtml(this.getIconSvg(icon)));
    });
  }

  private getIconSvg(name: string): string {
    const icons: Record<string, string> = {
      users: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>',
      building: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>',
      shield: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>',
      refresh: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>',
      check: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>',
      barChart: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="20" x2="12" y2="10"/><line x1="18" y1="20" x2="18" y2="4"/><line x1="6" y1="20" x2="6" y2="16"/></svg>',
      banknote: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2"/></svg>',
      alert: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
      pieChart: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21.21 15.89A10 10 0 1 1 8 2.83"/><path d="M22 12A10 10 0 0 0 12 2v10z"/></svg>',
      activity: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>'
    };
    return icons[name] || '';
  }

  setActiveTab(tab: DashboardTab): void {
    this.activeTab = tab;
  }

  loadDashboard(): void {
    if (!this.isRefreshing) this.loading = true;
    this.error = '';

    this.adminService.getDashboard().pipe(
      catchError(() => this.buildStatsFromApis()),
      finalize(() => {
        this.loading = false;
        this.isRefreshing = false;
        this.cdr.markForCheck();
      })
    ).subscribe({
      next: (stats) => {
        this.stats = stats;
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.error = err.message || 'Failed to load dashboard';
        this.cdr.markForCheck();
      }
    });
  }

  private buildStatsFromApis(): Observable<AdminDashboardStats> {
    return forkJoin({
      kyc: this.adminService.listKycApplications().pipe(catchError(() => of([] as KycApplication[]))),
      props: this.adminService.listPendingProperties().pipe(catchError(() => of([] as PropertySummary[])))
    }).pipe(map(({ kyc, props }) => this.composeStats(kyc, props)));
  }

  private composeStats(kyc: KycApplication[], props: PropertySummary[]): AdminDashboardStats {
    const landlords = kyc.filter(a => a.applicantType === 'LANDLORD').length;
    const tenants = kyc.filter(a => a.applicantType === 'TENANT').length;
    return {
      totalUsers: kyc.length,
      totalLandlords: landlords,
      totalTenants: tenants,
      kycPending: kyc.filter(a => a.status === 'pending').length,
      kycManualReview: kyc.filter(a => a.status === 'manual_review').length,
      kycRejected: kyc.filter(a => a.status === 'rejected').length,
      propertiesPendingVerification: props.length,
      activeTenancies: 0,
      apiStatus: 'UP',
      recentKycApplications: kyc.slice(0, 5),
      pendingProperties: props.slice(0, 5)
    };
  }

  refreshData(): void {
    this.isRefreshing = true;
    this.loadDashboard();
  }

  get greeting(): string {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  }

  get userInitials(): string {
    const name = this.currentUser?.fullName || 'Admin';
    const parts = name.trim().split(/\s+/);
    return parts.length >= 2 ? (parts[0][0] + parts[1][0]).toUpperCase() : name.substring(0, 2).toUpperCase();
  }

  get kycActionCount(): number {
    if (!this.stats) return 0;
    return this.stats.kycPending + this.stats.kycManualReview;
  }

  get recentKyc(): KycApplication[] {
    return this.stats?.recentKycApplications ?? [];
  }

  get pendingProperties(): PropertySummary[] {
    return this.stats?.pendingProperties ?? [];
  }

  get growthData(): AdminGrowthDataPoint[] {
    return this.stats?.growth ?? [];
  }

  get maxGrowthUsers(): number {
    return Math.max(...this.growthData.map(g => g.users), 1);
  }

  get maxGrowthRent(): number {
    return Math.max(...this.growthData.map(g => g.rentRoll), 1);
  }

  barHeightPercent(value: number, max: number): number {
    return Math.max(4, (value / max) * 100);
  }

  formatCurrency(amount: number): string {
    if (amount >= 1_000_000) return `KES ${(amount / 1_000_000).toFixed(1)}M`;
    if (amount >= 1_000) return `KES ${(amount / 1_000).toFixed(0)}K`;
    return `KES ${amount.toLocaleString()}`;
  }

  reviewKyc(app: KycApplication): void {
    this.router.navigate(['/admin/kyc-queue', app.id], { queryParams: { type: app.applicantType } });
  }

  verifyProperty(property: PropertySummary): void {
    if (this.verifyingPropertyId !== null) return;
    this.verifyingPropertyId = property.id;
    this.adminService.verifyProperty(property.id).subscribe({
      next: () => {
        this.verifyingPropertyId = null;
        this.snackBar.open(`${property.name} verified successfully.`, 'Close', { duration: 4000 });
        this.loadDashboard();
      },
      error: (err) => {
        this.verifyingPropertyId = null;
        this.error = err.message;
        this.cdr.markForCheck();
      }
    });
  }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      pending: 'Pending',
      manual_review: 'Manual Review',
      rejected: 'Rejected'
    };
    return labels[status] || status;
  }

  getStatusClass(status: string): string {
    const classes: Record<string, string> = {
      pending: 'status-pending',
      manual_review: 'status-review',
      rejected: 'status-rejected'
    };
    return classes[status] || '';
  }

  getApplicantTypeLabel(type: string): string {
    return type === 'LANDLORD' ? 'Landlord' : 'Tenant';
  }
}

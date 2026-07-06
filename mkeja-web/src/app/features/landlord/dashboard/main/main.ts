// landlord-dashboard-main.component.ts
import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatIconModule, MatIconRegistry } from '@angular/material/icon';
import { DomSanitizer } from '@angular/platform-browser';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AuthService, User } from '../../../../core/services/auth';
import { PropertyService, PropertySummary } from '../../../../core/services/property.service';
import { LandlordService, LandlordTenantSummary, LandlordInvitationSummary } from '../../../../core/services/landlord.service';
import { forkJoin } from 'rxjs';
import {
  HomeIcon, BuildingIcon, BanknoteIcon, FileTextIcon, AlertTriangleIcon,
  UserIcon, PieChartIcon, ArrowUpIcon, ArrowDownIcon, MinusIcon,
  RefreshCwIcon, PlusIcon, CheckCircleIcon, MailIcon, UnlockIcon, ClockIcon, HelpIcon
} from '../../../../shared/components/icons';

interface MonthChartPoint {
  label: string;
  shortLabel: string;
  collected: number;
  expected: number;
  collectionRate: number;
}

interface UnitStatusSegment {
  key: string;
  label: string;
  count: number;
  color: string;
  percent: number;
}

interface ActivityItem {
  id: string;
  icon: string;
  description: string;
  timeLabel: string;
}

interface TenantRow {
  id: string;
  kind: 'tenancy' | 'pending';
  name: string;
  phone: string;
  propertyName: string;
  unitRef: string;
  monthlyRent: number;
  rentDueDay?: number;
  kycStatus?: string;
  tenancyStatus?: string;
}

export type DashboardTab = 'overview' | 'alerts' | 'tenants';

@Component({
  selector: 'app-landlord-dashboard-main',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, MatIconModule, MatTooltipModule],
  templateUrl: './main.html',
  styleUrls: ['./main.css']
})
export class LandlordDashboardMainComponent implements OnInit {
  private snackBar = inject(MatSnackBar);
  private cdr = inject(ChangeDetectorRef);
  private iconRegistry = inject(MatIconRegistry);
  private sanitizer = inject(DomSanitizer);

  loading = true;
  isRefreshing = false;
  showPropertySelector = false;
  selectedProperty = 'all';
  activeTab: DashboardTab = 'overview';
  tenantSearchTerm = '';
  tenantStatusFilter = 'all';
  currentUser: User | null = null;
  kycPending = false;
  kycRejected = false;
  propertyCount = 0;
  lastUpdated = new Date();

  properties = [{ id: 'all', name: 'All Properties' }];
  portfolioProperties: PropertySummary[] = [];

  stats: {
    totalUnits: number;
    occupiedUnits: number;
    vacantUnits: number;
    monthlyRentExpected: number;
    collectedThisMonth: number;
    collectionRate: number;
  } | null = null;

  monthlyChartData: MonthChartPoint[] = [];
  tenancyList: LandlordTenantSummary[] = [];
  invitationList: LandlordInvitationSummary[] = [];
  recentPayments: any[] = [];
  riskAlerts: { id: string; tenantName: string; unitRef: string; reason: string; severity: string }[] = [];
  recentActivity: ActivityItem[] = [];

  lastRemittanceDate = new Date();
  lastRemittanceAmount = 0;
  nextSweepDate = new Date();

  readonly monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  readonly shortMonthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  constructor(
    private authService: AuthService,
    private propertyService: PropertyService,
    private landlordService: LandlordService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.registerIcons();
  }

  private registerIcons(): void {
    const icons: Record<string, string> = {
      home: HomeIcon,
      building: BuildingIcon,
      users: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
      creditCard: HomeIcon,
      barChart: HomeIcon,
      help: HelpIcon,
      chevronDown: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>',
      pieChart: PieChartIcon,
      trendingUp: ArrowUpIcon,
      zap: HomeIcon,
      refresh: RefreshCwIcon,
      plus: PlusIcon,
      download: FileTextIcon,
      bell: MailIcon,
      alert: AlertTriangleIcon,
      check: CheckCircleIcon,
      fileText: FileTextIcon,
      banknote: BanknoteIcon,
      user: UserIcon,
      arrowUp: ArrowUpIcon,
      arrowDown: ArrowDownIcon,
      minus: MinusIcon,
      mail: MailIcon,
      unlock: UnlockIcon,
      clock: ClockIcon,
      search: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>'
    };

    Object.entries(icons).forEach(([name, svg]) => {
      this.iconRegistry.addSvgIconLiteral(name, this.sanitizer.bypassSecurityTrustHtml(svg));
    });
  }

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    this.applyKycFlags(this.currentUser);
    this.authService.refreshToken().subscribe({
      next: (res) => {
        this.currentUser = this.authService.getUserFromResponse(res);
        this.applyKycFlags(this.authService.getUserFromResponse(res));
        this.cdr.markForCheck();
      }
    });
    this.route.queryParams.subscribe(params => {
      if (params['kyc'] === 'required') {
        this.snackBar.open(
          'Complete KYC verification before adding properties, units, or inviting tenants.',
          'Close',
          { duration: 6000 }
        );
      }
    });
    this.loadDashboardData();
  }

  private applyKycFlags(user: User | null): void {
    this.kycPending = user?.kycStatus === 'PENDING' || user?.kycStatus === 'MANUAL_REVIEW';
    this.kycRejected = user?.kycStatus === 'REJECTED';
  }

  get userInitials(): string {
    const name = this.currentUser?.fullName || 'Landlord';
    const parts = name.trim().split(/\s+/);
    return parts.length >= 2
      ? (parts[0][0] + parts[1][0]).toUpperCase()
      : name.substring(0, 2).toUpperCase();
  }

  get hasProperties(): boolean {
    return this.propertyCount > 0;
  }

  get hasUnits(): boolean {
    return (this.stats?.totalUnits || 0) > 0;
  }

  get kycApproved(): boolean {
    return this.authService.isLandlordKycApproved();
  }

  get filteredProperties(): PropertySummary[] {
    if (this.selectedProperty === 'all') {
      return this.portfolioProperties;
    }
    return this.portfolioProperties.filter(p => String(p.id) === this.selectedProperty);
  }

  get portfolioLabel(): string {
    if (this.selectedProperty === 'all') {
      return `${this.propertyCount} properties · ${this.stats?.totalUnits || 0} units`;
    }
    const prop = this.portfolioProperties.find(p => String(p.id) === this.selectedProperty);
    if (!prop) return 'Portfolio overview';
    return [prop.city, prop.county].filter(Boolean).join(', ') || prop.address || prop.name;
  }

  get occupancyRate(): number {
    if (!this.stats?.totalUnits) return 0;
    return (this.stats.occupiedUnits / this.stats.totalUnits) * 100;
  }

  get vacancyRate(): number {
    return 100 - this.occupancyRate;
  }

  get paymentCollectionRate(): number {
    const expected = this.stats?.monthlyRentExpected || 0;
    const collected = this.stats?.collectedThisMonth || 0;
    if (!expected) return 0;
    return (collected / expected) * 100;
  }

  get vacantUnits(): number {
    return this.stats?.vacantUnits || 0;
  }

  get potentialRentRoll(): number {
    return this.filteredProperties.reduce((sum, p) => {
      if (!p.totalUnits) return sum;
      if (!p.occupiedUnits || !p.monthlyRentRoll) {
        return sum + (p.monthlyRentRoll || 0);
      }
      const avgRent = p.monthlyRentRoll / p.occupiedUnits;
      return sum + avgRent * p.totalUnits;
    }, 0);
  }

  get outstandingRent(): number {
    const expected = this.stats?.monthlyRentExpected || 0;
    const collected = this.stats?.collectedThisMonth || 0;
    return Math.max(0, expected - collected);
  }

  get previousOccupancyRate(): number {
    if (this.monthlyChartData.length < 2) return this.occupancyRate;
    return Math.max(0, this.occupancyRate - 2);
  }

  get previousCollected(): number {
    if (this.monthlyChartData.length < 2) return 0;
    return this.monthlyChartData[this.monthlyChartData.length - 2].collected;
  }

  get currentMonthName(): string {
    return this.monthNames[new Date().getMonth()];
  }

  get maxChartAmount(): number {
    const values = this.monthlyChartData.flatMap(m => [m.collected, m.expected]);
    return Math.max(...values, 1);
  }

  get unitStatusSegments(): UnitStatusSegment[] {
    const total = this.stats?.totalUnits || 0;
    if (!total) return [];

    const occupied = this.stats?.occupiedUnits || 0;
    const vacant = this.stats?.vacantUnits || 0;
    const reserved = Math.max(0, total - occupied - vacant);

    const segments = [
      { key: 'occupied', label: 'Occupied', count: occupied, color: '#10B981' },
      { key: 'vacant', label: 'Vacant', count: vacant, color: '#F59E0B' },
      { key: 'reserved', label: 'Other', count: reserved, color: '#6366F1' }
    ].filter(s => s.count > 0);

    return segments.map(s => ({
      ...s,
      percent: (s.count / total) * 100
    }));
  }

  get statusDonutGradient(): string {
    const segments = this.unitStatusSegments;
    if (!segments.length) {
      return 'conic-gradient(#E5E7EB 0deg 360deg)';
    }

    let cursor = 0;
    const stops = segments.map(s => {
      const start = cursor;
      cursor += s.percent * 3.6;
      return `${s.color} ${start}deg ${cursor}deg`;
    });
    return `conic-gradient(${stops.join(', ')})`;
  }

  get propertiesWithVacancies(): PropertySummary[] {
    return this.filteredProperties.filter(p => (p.vacantUnits || 0) > 0);
  }

  get propertiesWithInvites(): PropertySummary[] {
    return this.filteredProperties.filter(p => (p.pendingInvites || 0) > 0);
  }

  get alertCount(): number {
    return this.riskAlerts.length + this.propertiesWithVacancies.length + this.filteredInvitations.length;
  }

  get filteredInvitations(): LandlordInvitationSummary[] {
    const propertyName = this.selectedProperty === 'all' ? null : this.getSelectedPropertyName();
    return this.invitationList.filter(i => !propertyName || i.propertyName === propertyName);
  }

  get tenantRows(): TenantRow[] {
    const propertyName = this.selectedProperty === 'all'
      ? null
      : this.getSelectedPropertyName();

    const tenancies = this.tenancyList
      .filter(t => !propertyName || t.propertyName === propertyName)
      .map(t => ({
        id: `tenancy-${t.tenancyId}`,
        kind: 'tenancy' as const,
        name: t.tenantName,
        phone: t.tenantPhone,
        propertyName: t.propertyName,
        unitRef: t.unitNumber,
        monthlyRent: t.monthlyRent,
        rentDueDay: t.rentDueDay,
        kycStatus: t.kycStatus,
        tenancyStatus: t.tenancyStatus
      }));

    const invites = this.invitationList
      .filter(i => !propertyName || i.propertyName === propertyName)
      .map(i => ({
        id: `invite-${i.code}`,
        kind: 'pending' as const,
        name: i.tenantName,
        phone: i.tenantPhone,
        propertyName: i.propertyName,
        unitRef: i.unitNumber,
        monthlyRent: i.monthlyRent,
        rentDueDay: i.rentDueDay,
        kycStatus: i.existingTenant ? 'APPROVED' : 'PENDING',
        tenancyStatus: 'PENDING_INVITE'
      }));

    return [...tenancies, ...invites];
  }

  get filteredTenantRows(): TenantRow[] {
    let rows = this.tenantRows;

    if (this.tenantStatusFilter === 'active') {
      rows = rows.filter(r => r.kind === 'tenancy');
    } else if (this.tenantStatusFilter === 'pending') {
      rows = rows.filter(r => r.kind === 'pending');
    } else if (this.tenantStatusFilter === 'kyc_pending') {
      rows = rows.filter(r => r.kycStatus !== 'APPROVED' && r.kycStatus !== 'VERIFIED');
    }

    if (this.tenantSearchTerm) {
      const term = this.tenantSearchTerm.toLowerCase();
      rows = rows.filter(r =>
        r.name.toLowerCase().includes(term) ||
        r.phone.includes(term) ||
        r.unitRef.toLowerCase().includes(term) ||
        r.propertyName.toLowerCase().includes(term)
      );
    }

    return rows;
  }

  get hasTenantRows(): boolean {
    return this.tenantRows.length > 0;
  }

  setActiveTab(tab: DashboardTab): void {
    this.activeTab = tab;
  }

  private loadDashboardData(): void {
    forkJoin({
      properties: this.propertyService.listProperties(),
      tenants: this.landlordService.listTenants(),
      invitations: this.landlordService.listPendingInvitations()
    }).subscribe({
      next: ({ properties, tenants, invitations }) => {
        this.portfolioProperties = properties;
        this.tenancyList = tenants;
        this.invitationList = invitations;
        this.propertyCount = properties.length;
        this.properties = [
          { id: 'all', name: 'All Properties' },
          ...properties.map(p => ({ id: String(p.id), name: p.name }))
        ];
        this.applyPortfolioStats();
        this.buildRiskAlerts();
        this.lastUpdated = new Date();
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.portfolioProperties = [];
        this.tenancyList = [];
        this.invitationList = [];
        this.propertyCount = 0;
        this.properties = [{ id: 'all', name: 'All Properties' }];
        this.stats = {
          totalUnits: 0,
          occupiedUnits: 0,
          vacantUnits: 0,
          monthlyRentExpected: 0,
          collectedThisMonth: 0,
          collectionRate: 0
        };
        this.monthlyChartData = [];
        this.recentActivity = [];
        this.riskAlerts = [];
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }

  private buildRiskAlerts(): void {
    const alerts: typeof this.riskAlerts = [];
    const propertyName = this.selectedProperty === 'all' ? null : this.getSelectedPropertyName();

    this.tenancyList
      .filter(t => !propertyName || t.propertyName === propertyName)
      .forEach(t => {
        if (t.kycStatus !== 'APPROVED' && t.kycStatus !== 'VERIFIED') {
          alerts.push({
            id: `kyc-${t.tenancyId}`,
            tenantName: t.tenantName,
            unitRef: `${t.propertyName} · ${t.unitNumber}`,
            reason: 'KYC not verified',
            severity: 'high'
          });
        }
      });

    this.invitationList
      .filter(i => !propertyName || i.propertyName === propertyName)
      .forEach(i => {
        alerts.push({
          id: `invite-${i.code}`,
          tenantName: i.tenantName,
          unitRef: `${i.propertyName} · ${i.unitNumber}`,
          reason: 'Pending tenant invite',
          severity: 'medium'
        });
      });

    this.riskAlerts = alerts;
  }

  private applyPortfolioStats(): void {
    const props = this.filteredProperties;
    const totalUnits = props.reduce((sum, p) => sum + (p.totalUnits || 0), 0);
    const occupiedUnits = props.reduce((sum, p) => sum + (p.occupiedUnits || 0), 0);
    const vacantUnits = props.reduce((sum, p) => sum + (p.vacantUnits || 0), 0);
    const monthlyRentExpected = props.reduce((sum, p) => sum + (p.monthlyRentRoll || 0), 0);

    const collectedThisMonth = this.recentPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
    const collectionRate = monthlyRentExpected > 0
      ? Math.round((collectedThisMonth / monthlyRentExpected) * 100)
      : 0;

    this.stats = {
      totalUnits,
      occupiedUnits,
      vacantUnits,
      monthlyRentExpected,
      collectedThisMonth,
      collectionRate
    };

    this.rebuildChartData(monthlyRentExpected);
    this.buildRecentActivity(props);
    this.buildRiskAlerts();
  }

  private rebuildChartData(expectedMonthly: number): void {
    const now = new Date();
    const points: MonthChartPoint[] = [];

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthIndex = d.getMonth();
      const isCurrentMonth = i === 0;
      const collected = isCurrentMonth ? (this.stats?.collectedThisMonth || 0) : 0;

      points.push({
        label: `${this.monthNames[monthIndex]} ${d.getFullYear()}`,
        shortLabel: this.shortMonthNames[monthIndex],
        collected,
        expected: expectedMonthly,
        collectionRate: expectedMonthly > 0 ? (collected / expectedMonthly) * 100 : 0
      });
    }

    this.monthlyChartData = points;
  }

  private buildRecentActivity(props: PropertySummary[]): void {
    const items: ActivityItem[] = [];

    this.recentPayments.slice(0, 5).forEach(payment => {
      items.push({
        id: `pay-${payment.id}`,
        icon: 'banknote',
        description: `Payment received from ${payment.tenantName} (${payment.unitRef})`,
        timeLabel: this.formatTimeAgo(payment.date)
      });
    });

    props
      .filter(p => (p.pendingInvites || 0) > 0)
      .slice(0, 3)
      .forEach(p => {
        items.push({
          id: `invite-${p.id}`,
          icon: 'mail',
          description: `${p.pendingInvites} pending tenant invite(s) at ${p.name}`,
          timeLabel: 'Pending'
        });
      });

    if (items.length === 0 && props.length > 0) {
      items.push({
        id: 'portfolio-ready',
        icon: 'building',
        description: `Portfolio active with ${this.stats?.totalUnits || 0} units across ${props.length} ${props.length === 1 ? 'property' : 'properties'}`,
        timeLabel: this.formatDate(this.lastUpdated)
      });
    }

    this.recentActivity = items.slice(0, 8);
  }

  barHeightPercent(amount: number): number {
    return Math.max(4, (amount / this.maxChartAmount) * 100);
  }

  getTrendClass(current: number, previous: number): string {
    if (current > previous) return 'up';
    if (current < previous) return 'down';
    return 'neutral';
  }

  getTrendIcon(current: number, previous: number): string {
    if (current > previous) return 'arrowUp';
    if (current < previous) return 'arrowDown';
    return 'minus';
  }

  getTrendPercentage(current: number, previous: number): string {
    if (previous === 0) return current > 0 ? '+100%' : '0%';
    const change = ((current - previous) / previous) * 100;
    return `${change > 0 ? '+' : ''}${change.toFixed(0)}%`;
  }

  get greeting(): string {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  }

  togglePropertySelector(): void {
    this.showPropertySelector = !this.showPropertySelector;
  }

  selectProperty(propertyId: string): void {
    this.selectedProperty = propertyId;
    this.showPropertySelector = false;
    this.applyPortfolioStats();
    this.cdr.markForCheck();
  }

  getSelectedPropertyName(): string {
    return this.properties.find(p => p.id === this.selectedProperty)?.name || '';
  }

  refreshData(): void {
    this.isRefreshing = true;
    this.loadDashboardData();
    setTimeout(() => {
      this.isRefreshing = false;
      this.cdr.markForCheck();
    }, 600);
  }

  onAddProperty(): void {
    this.router.navigate(['/landlord/properties/add']);
  }

  onAddTenant(): void {
    if (!this.kycApproved) {
      this.router.navigate(['/landlord/dashboard'], { queryParams: { kyc: 'required' } });
      return;
    }
    if (!this.hasUnits) {
      this.snackBar.open('Add a property with units before inviting tenants.', 'Close', { duration: 5000 });
      this.router.navigate(['/landlord/properties']);
      return;
    }
    this.router.navigate(['/landlord/tenants/invite']);
  }

  onAddUnit(): void {
    if (!this.kycApproved) {
      this.router.navigate(['/landlord/dashboard'], { queryParams: { kyc: 'required' } });
      return;
    }
    this.router.navigate(['/landlord/properties']);
  }

  onViewProperties(): void {
    this.router.navigate(['/landlord/properties']);
  }

  onViewProperty(propertyId: number | string): void {
    this.router.navigate(['/landlord/properties', propertyId]);
  }

  onViewRiskAlert(alertId: string): void {
    this.router.navigate(['/landlord/tenants']);
  }

  onViewAllTenants(): void {
    this.router.navigate(['/landlord/tenants']);
  }

  onViewRemittanceHistory(): void {
    this.router.navigate(['/landlord/remittances/history']);
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0
    }).format(amount || 0);
  }

  formatDate(date: Date): string {
    if (!date) return 'N/A';
    return date.toLocaleDateString('en-KE', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  formatTimeAgo(date: Date): string {
    const diff = Date.now() - date.getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins} min ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    return this.formatDate(date);
  }

  formatRentDue(day?: number): string {
    if (!day) return '1st of month';
    const suffix = day >= 11 && day <= 13 ? 'th' :
      day % 10 === 1 ? 'st' : day % 10 === 2 ? 'nd' : day % 10 === 3 ? 'rd' : 'th';
    return `${day}${suffix} of month`;
  }

  getKycBadgeClass(status?: string): string {
    if (status === 'APPROVED' || status === 'VERIFIED') return 'approved';
    if (status === 'REJECTED') return 'rejected';
    return 'pending';
  }

  getKycLabel(status?: string): string {
    if (status === 'APPROVED' || status === 'VERIFIED') return 'Verified';
    if (status === 'REJECTED') return 'Rejected';
    return 'Pending';
  }
}

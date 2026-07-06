// tenant-financial-hub.component.ts
import { Component, OnInit, OnDestroy, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Subject, takeUntil, interval } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatIconModule, MatIconRegistry } from '@angular/material/icon';
import { DomSanitizer } from '@angular/platform-browser';
import { MatTooltipModule } from '@angular/material/tooltip';

// Import models
import { TenantData, PropertyData, FinancialData, RatibaData, FulizaData, BankData } from '../../../../models/financial.model';


// Import icons
import { 
  HomeIcon, CreditCardIcon, CalendarIcon, ZapIcon, FileTextIcon, 
  BuildingIcon, HelpIcon, KeyIcon, ChevronLeftIcon, ChevronRightIcon, 
  UserIcon, SettingsIcon, LogOutIcon, MenuIcon, BellIcon, 
  PhoneIcon, MailIcon, ShieldCheckIcon, AlertTriangleIcon, 
  CheckCircleIcon, XCircleIcon, WalletIcon, BanknoteIcon, 
  TrendingUpIcon, ArrowDownIcon, ArrowUpIcon, ClockIcon, 
  EyeIcon, EyeOffIcon, PlusIcon, MinusIcon, RefreshCwIcon, 
  LockIcon, UnlockIcon, PieChartIcon, BarChartIcon, 
  DownloadIcon, Share2Icon, CopyIcon, ExternalLinkIcon 
} from '../../../../shared/components/icons';
import { FinancialService } from '../../../../core/services/financial';
import { FulizaService } from '../../../../core/services/fuliza';
import { RatibaService } from '../../../../core/services/ratiba';
import { TransactionService } from '../../../../core/services/transactions';
import { AnalyticsComponent } from '../../analytics/analytics';
import { BankComponent } from '../../bank/bank';
import { FulizaComponent } from '../../fuliza/fuliza';
import { OverviewComponent } from '../../overview/overview';
import { RatibaComponent } from '../../ratiba/ratiba';
import { TransactionsComponent } from '../../transactions/transactions';
import { MpesaHeaderComponent } from '../../../../shared/components/header/header';
import { AuthService, User } from '../../../../core/services/auth';

@Component({
  selector: 'app-tenant-financial-hub',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatIconModule,
    MatTooltipModule,
    OverviewComponent,
    RatibaComponent,
    FulizaComponent,
    TransactionsComponent,
    BankComponent,
    AnalyticsComponent,
    MpesaHeaderComponent
  ],
  templateUrl: './main.html',
  styleUrls: ['./main.css']
})
export class TenantDashboardMainComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private snackBar = inject(MatSnackBar);
  private cdr = inject(ChangeDetectorRef);
  private iconRegistry = inject(MatIconRegistry);
  private sanitizer = inject(DomSanitizer);

  // Make services public so they can be accessed in the template
  public financialService = inject(FinancialService);
  public ratibaService = inject(RatibaService);
  public fulizaService = inject(FulizaService);
  public transactionService = inject(TransactionService);

  // State
  isLoading = true;
  isRefreshing = false;
  sidebarCollapsed = false;
  currentTime = '';
  currentUser: User | null = null;
  kycPending = false;
  kycRejected = false;
  activeTab: 'overview' | 'ratiba' | 'fuliza' | 'transactions' | 'bank' | 'analytics' = 'overview';
  private refreshInterval: ReturnType<typeof setInterval> | null = null;

  // Data
  tenantData!: TenantData;
  propertyData!: PropertyData;
  financialData!: FinancialData;
  ratibaData!: RatibaData;
  fulizaData!: FulizaData;
  bankData!: BankData;

  // Computed
  get greeting(): string {
    const hour = new Date().getHours();
    if (hour < 12) return 'Morning';
    if (hour < 17) return 'Afternoon';
    return 'Evening';
  }

  get kycApproved(): boolean {
    return this.authService.isKycApproved(this.currentUser?.kycStatus);
  }

  constructor(private authService: AuthService) {
    this.registerIcons();
    const savedCollapsed = localStorage.getItem('sidebarCollapsed');
    if (savedCollapsed !== null) this.sidebarCollapsed = savedCollapsed === 'true';
  }

  private registerIcons(): void {
    const icons = {
      home: HomeIcon,
      creditCard: CreditCardIcon,
      calendar: CalendarIcon,
      zap: ZapIcon,
      fileText: FileTextIcon,
      building: BuildingIcon,
      key: KeyIcon,
      help: HelpIcon,
      chevronLeft: ChevronLeftIcon,
      chevronRight: ChevronRightIcon,
      user: UserIcon,
      settings: SettingsIcon,
      logout: LogOutIcon,
      menu: MenuIcon,
      bell: BellIcon,
      phone: PhoneIcon,
      mail: MailIcon,
      shield: ShieldCheckIcon,
      alert: AlertTriangleIcon,
      check: CheckCircleIcon,
      xCircle: XCircleIcon,
      wallet: WalletIcon,
      banknote: BanknoteIcon,
      trendingUp: TrendingUpIcon,
      arrowDown: ArrowDownIcon,
      arrowUp: ArrowUpIcon,
      clock: ClockIcon,
      eye: EyeIcon,
      eyeOff: EyeOffIcon,
      plus: PlusIcon,
      minus: MinusIcon,
      refresh: RefreshCwIcon,
      lock: LockIcon,
      unlock: UnlockIcon,
      pieChart: PieChartIcon,
      barChart: BarChartIcon,
      download: DownloadIcon,
      share: Share2Icon,
      copy: CopyIcon,
      external: ExternalLinkIcon,
      signal: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 20h.01"/><path d="M7 20v-4"/><path d="M12 20v-8"/><path d="M17 20V8"/><path d="M22 4v16"/></svg>',
      wifi: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12.55a11 11 0 0 1 14.08 0"/><path d="M1.42 9a16 16 0 0 1 21.16 0"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><line x1="12" y1="20" x2="12.01" y2="20"/></svg>',
      battery: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="1" y="6" width="18" height="12" rx="2"/><line x1="23" y1="10" x2="23" y2="14"/></svg>'
    };

    Object.entries(icons).forEach(([name, svg]) => {
      this.iconRegistry.addSvgIconLiteral(name, this.sanitizer.bypassSecurityTrustHtml(svg));
    });
  }

  ngOnInit(): void {
    this.updateClock();
    this.refreshInterval = setInterval(() => this.updateClock(), 1000);
    this.currentUser = this.authService.getCurrentUser();
    this.applyKycFlags(this.currentUser);

    this.authService.refreshToken().subscribe({
      next: (res) => {
        this.currentUser = this.authService.getUserFromResponse(res);
        this.applyKycFlags(this.authService.getUserFromResponse(res));
        if (this.kycApproved) {
          this.loadAllData();
        } else {
          this.isLoading = false;
          this.cdr.markForCheck();
        }
      },
      error: () => {
        if (this.kycApproved) {
          this.loadAllData();
        } else {
          this.isLoading = false;
          this.cdr.markForCheck();
        }
      }
    });
  }

  private applyKycFlags(user: User | null): void {
    this.kycPending = this.authService.isKycPending(user?.kycStatus);
    this.kycRejected = this.authService.isKycRejected(user?.kycStatus);
  }

  get userInitials(): string {
    const name = this.currentUser?.fullName || 'Tenant';
    return name.trim().charAt(0).toUpperCase();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    if (this.refreshInterval) clearInterval(this.refreshInterval);
  }

  private updateClock(): void {
    const now = new Date();
    this.currentTime = now.toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit', hour12: false });
  }

  private loadAllData(): void {
    this.isLoading = true;

    Promise.all([
      this.financialService.getTenantData().toPromise(),
      this.financialService.getPropertyData().toPromise(),
      this.financialService.getFinancialData().toPromise(),
      this.ratibaService.getRatibaData().toPromise(),
      this.fulizaService.getFulizaData().toPromise(),
      this.financialService.getBankData().toPromise()
    ]).then(([tenant, property, financial, ratiba, fuliza, bank]) => {
      this.tenantData = tenant!;
      this.propertyData = property!;
      this.financialData = financial!;
      this.ratibaData = ratiba!;
      this.fulizaData = fuliza!;
      this.bankData = bank!;
      this.isLoading = false;
      this.cdr.detectChanges();
    }).catch(() => {
      this.isLoading = false;
      this.snackBar.open('Failed to load data. Please refresh.', 'Close', { duration: 3000 });
    });
  }

  refreshData(): void {
    this.isRefreshing = true;

    Promise.all([
      this.financialService.refreshFinancialData().toPromise(),
      this.ratibaService.refreshRatibaData().toPromise(),
      this.fulizaService.refreshFulizaData().toPromise(),
      this.transactionService.refreshTransactions().toPromise()
    ]).then(() => {
      this.loadAllData();
      setTimeout(() => {
        this.isRefreshing = false;
        this.snackBar.open('Financial data refreshed', 'Close', { duration: 3000 });
        this.cdr.detectChanges();
      }, 500);
    }).catch(() => {
      this.isRefreshing = false;
      this.snackBar.open('Failed to refresh data', 'Close', { duration: 3000 });
    });
  }

  toggleSidebar(): void {
    this.sidebarCollapsed = !this.sidebarCollapsed;
    localStorage.setItem('sidebarCollapsed', String(this.sidebarCollapsed));
  }

  setActiveTab(tab: typeof this.activeTab): void {
    this.activeTab = tab;
  }

  onContactLandlord(): void {
    this.snackBar.open(`Calling ${this.propertyData.landlordPhone || 'landlord'}...`, 'Close', { duration: 3000 });
  }

  onExportTransactions(): void {
    this.snackBar.open('Exporting transactions... Your file will download shortly.', 'Close', { duration: 3000 });
  }
}
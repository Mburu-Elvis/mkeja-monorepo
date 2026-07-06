import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatIconModule, MatIconRegistry } from '@angular/material/icon';
import { DomSanitizer } from '@angular/platform-browser';
import { Subject, forkJoin } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { LandlordPropertiesAddUnitComponent } from '../add-unit/add-unit';
import { PropertyMediaComponent } from '../property-media/property-media';
import { FilterByStatusPipe } from './filter-by-status.pipe';
import { PropertyService, PropertySummary, UnitSummary } from '../../../../core/services/property.service';
import { PLATFORM_UNIT_TYPES, unitTypeLabel } from '../../../../shared/constants/unit-types';
import {
  HomeIcon, BuildingIcon, PieChartIcon, BanknoteIcon, FileTextIcon, AlertTriangleIcon,
  UserIcon, CreditCardIcon, WrenchIcon, CheckCircleIcon, LogOutIcon, EditIcon,
  ArrowUpIcon, ArrowDownIcon, MinusIcon, RefreshCwIcon, MailIcon, UnlockIcon
} from '../../../../shared/components/icons';

// ==================== TYPE DEFINITIONS ====================

export interface Property {
  id: string;
  name: string;
  location: string;
  county: string;
  subCounty: string;
  address: string;
  status: 'active' | 'under_maintenance' | 'inactive';
  verified: boolean;
  lastUpdated: Date;
  totalUnits: number;
  occupiedUnits: number;
  maintenanceUnits: number;
  totalRevenue: number;
  expectedRevenue: number;
  description: string;
  imageUrl?: string;
}

export interface Unit {
  id: string;
  unitNumber: string;
  type: string;
  unitTypeCode: string;
  floor: number;
  block: string;
  status: 'vacant' | 'occupied' | 'maintenance' | 'reserved';
  tenantId: string | null;
  tenantName: string | null;
  rent: number;
  balance: number;
  size: number;
  features: string[];
}

export interface Tenant {
  id: string;
  name: string;
  phone: string;
  email: string;
  unitId: string;
  unitNumber: string;
  leaseStart: Date;
  leaseEnd: Date | null;
  status: 'active' | 'inactive' | 'pending';
  balance: number;
  lastPayment: Date | null;
  lastPaymentAmount: number;
}

export interface Payment {
  id: string;
  date: Date;
  tenantId: string;
  tenantName: string;
  unitId: string;
  unitNumber: string;
  amount: number;
  method: 'mpesa' | 'bank' | 'cash' | 'card';
  status: 'completed' | 'pending' | 'failed';
  receiptNumber: string;
  month: string;
  year: number;
}

export interface MaintenanceIssue {
  id: string;
  unitId: string;
  unitNumber: string;
  issue: string;
  description: string;
  status: 'pending' | 'in_progress' | 'resolved' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'emergency';
  reportedDate: Date;
  resolvedDate: Date | null;
  assignedTo: string | null;
  estimatedCost: number;
  actualCost: number;
}

export interface Activity {
  id: string;
  type: 'payment' | 'tenant_added' | 'issue_reported' | 'unit_vacated' | 'unit_occupied' | 'maintenance_resolved' | 'lease_terminated' | 'unit_updated';
  description: string;
  timestamp: Date;
  unitNumber?: string;
  tenantName?: string;
  amount?: number;
}

export interface MonthChartPoint {
  label: string;
  shortLabel: string;
  monthIndex: number;
  year: number;
  collected: number;
  expected: number;
  collectionRate: number;
}

export interface UnitStatusSegment {
  key: string;
  label: string;
  count: number;
  color: string;
  percent: number;
}

// ==================== MOCK DATA (ancillary tabs) ====================

const EMPTY_PROPERTY: Property = {
  id: '',
  name: '',
  location: '',
  county: '',
  subCounty: '',
  address: '',
  status: 'active',
  verified: false,
  lastUpdated: new Date(),
  totalUnits: 0,
  occupiedUnits: 0,
  maintenanceUnits: 0,
  totalRevenue: 0,
  expectedRevenue: 0,
  description: ''
};

const MOCK_TENANTS: Tenant[] = [
  { id: 'tenant_1', name: 'John Doe', phone: '254712345678', email: 'john@example.com', unitId: 'unit_1', unitNumber: 'A101', leaseStart: new Date('2024-01-01'), leaseEnd: null, status: 'active', balance: 0, lastPayment: new Date('2026-05-01'), lastPaymentAmount: 45000 },
  { id: 'tenant_2', name: 'Mary Wanjiku', phone: '254723456789', email: 'mary@example.com', unitId: 'unit_3', unitNumber: 'A103', leaseStart: new Date('2024-03-15'), leaseEnd: null, status: 'active', balance: 10000, lastPayment: new Date('2026-04-15'), lastPaymentAmount: 65000 },
  { id: 'tenant_3', name: 'Peter Omondi', phone: '254734567890', email: 'peter@example.com', unitId: 'unit_4', unitNumber: 'B201', leaseStart: new Date('2024-06-01'), leaseEnd: null, status: 'active', balance: 0, lastPayment: new Date('2026-05-01'), lastPaymentAmount: 45000 },
  { id: 'tenant_4', name: 'Sarah Kimani', phone: '254745678901', email: 'sarah@example.com', unitId: 'unit_6', unitNumber: 'B203', leaseStart: new Date('2024-02-10'), leaseEnd: null, status: 'active', balance: 5000, lastPayment: new Date('2026-04-20'), lastPaymentAmount: 115000 },
  { id: 'tenant_5', name: 'James Mwangi', phone: '254756789012', email: 'james@example.com', unitId: 'unit_8', unitNumber: 'C302', leaseStart: new Date('2024-09-01'), leaseEnd: null, status: 'active', balance: 0, lastPayment: new Date('2026-05-01'), lastPaymentAmount: 45000 }
];

const MOCK_PAYMENTS: Payment[] = [
  { id: 'pay_1', date: new Date('2026-05-01'), tenantId: 'tenant_1', tenantName: 'John Doe', unitId: 'unit_1', unitNumber: 'A101', amount: 45000, method: 'mpesa', status: 'completed', receiptNumber: 'RCP-001', month: 'May', year: 2026 },
  { id: 'pay_2', date: new Date('2026-04-15'), tenantId: 'tenant_2', tenantName: 'Mary Wanjiku', unitId: 'unit_3', unitNumber: 'A103', amount: 65000, method: 'bank', status: 'completed', receiptNumber: 'RCP-002', month: 'April', year: 2026 },
  { id: 'pay_3', date: new Date('2026-05-01'), tenantId: 'tenant_3', tenantName: 'Peter Omondi', unitId: 'unit_4', unitNumber: 'B201', amount: 45000, method: 'mpesa', status: 'completed', receiptNumber: 'RCP-003', month: 'May', year: 2026 },
  { id: 'pay_4', date: new Date('2026-04-20'), tenantId: 'tenant_4', tenantName: 'Sarah Kimani', unitId: 'unit_6', unitNumber: 'B203', amount: 115000, method: 'mpesa', status: 'completed', receiptNumber: 'RCP-004', month: 'April', year: 2026 },
  { id: 'pay_5', date: new Date('2026-05-01'), tenantId: 'tenant_5', tenantName: 'James Mwangi', unitId: 'unit_8', unitNumber: 'C302', amount: 45000, method: 'cash', status: 'completed', receiptNumber: 'RCP-005', month: 'May', year: 2026 },
  { id: 'pay_6', date: new Date('2026-04-05'), tenantId: 'tenant_1', tenantName: 'John Doe', unitId: 'unit_1', unitNumber: 'A101', amount: 45000, method: 'mpesa', status: 'completed', receiptNumber: 'RCP-006', month: 'April', year: 2026 },
  { id: 'pay_7', date: new Date('2026-03-01'), tenantId: 'tenant_1', tenantName: 'John Doe', unitId: 'unit_1', unitNumber: 'A101', amount: 45000, method: 'mpesa', status: 'completed', receiptNumber: 'RCP-007', month: 'March', year: 2026 },
  { id: 'pay_8', date: new Date('2026-02-01'), tenantId: 'tenant_1', tenantName: 'John Doe', unitId: 'unit_1', unitNumber: 'A101', amount: 45000, method: 'mpesa', status: 'completed', receiptNumber: 'RCP-008', month: 'February', year: 2026 },
  { id: 'pay_9', date: new Date('2026-01-01'), tenantId: 'tenant_1', tenantName: 'John Doe', unitId: 'unit_1', unitNumber: 'A101', amount: 45000, method: 'mpesa', status: 'completed', receiptNumber: 'RCP-009', month: 'January', year: 2026 }
];

const MOCK_ISSUES: MaintenanceIssue[] = [
  { id: 'issue_1', unitId: 'unit_1', unitNumber: 'A101', issue: 'Water Leak', description: 'Leaking pipe under sink', status: 'in_progress', priority: 'high', reportedDate: new Date('2026-05-02'), resolvedDate: null, assignedTo: 'John Plumber', estimatedCost: 5000, actualCost: 0 },
  { id: 'issue_2', unitId: 'unit_5', unitNumber: 'B202', issue: 'Electrical Fault', description: 'Frequent power trips', status: 'pending', priority: 'emergency', reportedDate: new Date('2026-05-03'), resolvedDate: null, assignedTo: null, estimatedCost: 3000, actualCost: 0 },
  { id: 'issue_3', unitId: 'unit_3', unitNumber: 'A103', issue: 'Broken Window', description: 'Cracked glass on bedroom window', status: 'resolved', priority: 'medium', reportedDate: new Date('2026-04-20'), resolvedDate: new Date('2026-04-28'), assignedTo: 'Glass Specialist', estimatedCost: 8000, actualCost: 7500 }
];

const MOCK_ACTIVITIES: Activity[] = [
  { id: 'act_1', type: 'payment', description: 'Payment received from John Doe', timestamp: new Date('2026-05-01T10:30:00'), unitNumber: 'A101', tenantName: 'John Doe', amount: 45000 },
  { id: 'act_2', type: 'tenant_added', description: 'New tenant James Mwangi added', timestamp: new Date('2026-04-28T14:15:00'), tenantName: 'James Mwangi' },
  { id: 'act_3', type: 'issue_reported', description: 'Water leak reported in A101', timestamp: new Date('2026-05-02T09:00:00'), unitNumber: 'A101' },
  { id: 'act_4', type: 'unit_vacated', description: 'Unit B202 vacated', timestamp: new Date('2026-04-25T16:20:00'), unitNumber: 'B202' },
  { id: 'act_5', type: 'maintenance_resolved', description: 'Broken window fixed in A103', timestamp: new Date('2026-04-28T11:00:00'), unitNumber: 'A103' }
];

// ==================== COMPONENT ====================

@Component({
  selector: 'app-property-details',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    MatIconModule,
    LandlordPropertiesAddUnitComponent,
    PropertyMediaComponent,
    FilterByStatusPipe
  ],
  templateUrl: './property-details.html',
  styleUrls: ['./property-details.css']
})
export class PropertyDetailsComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private iconRegistry = inject(MatIconRegistry);
  private sanitizer = inject(DomSanitizer);

  // Data
  property: Property = { ...EMPTY_PROPERTY };
  units: Unit[] = [];
  tenants: Tenant[] = MOCK_TENANTS;
  payments: Payment[] = MOCK_PAYMENTS;
  issues: MaintenanceIssue[] = MOCK_ISSUES;
  activities: Activity[] = MOCK_ACTIVITIES;
  loading = true;
  loadError = false;

  // UI State
  activeTab: string = 'overview';
  selectedUnit: Unit | null = null;
  selectedTenant: Tenant | null = null;
  selectedPayment: Payment | null = null;
  selectedIssue: MaintenanceIssue | null = null;

  // Filters
  unitStatusFilter: string = 'all';
  unitTypeFilter: string = 'all';
  unitFloorFilter: string = 'all';
  tenantStatusFilter: string = 'all';
  tenantBalanceFilter: string = 'all';
  paymentStatusFilter: string = 'all';
  paymentMonthFilter: string = 'all';
  paymentYearFilter: string = 'all';
  paymentMethodFilter: string = 'all';
  paymentSearchTerm: string = '';
  issueStatusFilter: string = 'all';
  issuePriorityFilter: string = 'all';
  issueSearchTerm: string = '';

  // Pagination
  readonly pageSizeOptions = [5, 10, 25, 50];
  pageSize = 10;
  unitsPage = 1;
  tenantsPage = 1;
  paymentsPage = 1;
  issuesPage = 1;

  // Search
  unitSearchTerm: string = '';
  tenantSearchTerm: string = '';

  // Chart data (derived from property + payments)
  monthlyChartData: MonthChartPoint[] = [];
  readonly monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  readonly shortMonthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  // Modals
  showAddUnitModal = false;
  showAddTenantModal = false;
  showRecordPaymentModal = false;
  showAddIssueModal = false;
  showEditUnitModal = false;
  editUnitSaving = false;
  unitTypeOptions = PLATFORM_UNIT_TYPES;
  showTenantProfileModal = false;

  // Forms
  addTenantForm!: FormGroup;
  recordPaymentForm!: FormGroup;
  addIssueForm!: FormGroup;
  editUnitForm!: FormGroup;

  // sidebar
  sidebarCollapsed = false;
  get vacantUnits(): Unit[] {
    return this.units.filter(u => u.status === 'vacant');
  }

  get occupiedUnits(): Unit[] {
    return this.units.filter(u => u.status === 'occupied');
  }

  get maintenanceUnits(): Unit[] {
    return this.units.filter(u => u.status === 'maintenance');
  }

  get occupancyRate(): number {
    if (!this.property.totalUnits) return 0;
    return (this.occupiedUnits.length / this.property.totalUnits) * 100;
  }

  get totalRevenue(): number {
    return this.payments
      .filter(p => p.status === 'completed' && p.month === this.currentMonthName && p.year === this.currentYear)
      .reduce((sum, p) => sum + p.amount, 0);
  }

  get currentMonthName(): string {
    return this.monthNames[new Date().getMonth()];
  }

  get currentYear(): number {
    return new Date().getFullYear();
  }

  get expectedMonthlyRent(): number {
    return this.occupiedUnits.reduce((sum, u) => sum + u.rent, 0);
  }

  get potentialMonthlyRent(): number {
    return this.units.reduce((sum, u) => sum + u.rent, 0);
  }

  get expectedRevenue(): number {
    return this.expectedMonthlyRent;
  }

  get outstandingRent(): number {
    return this.tenants.reduce((sum, t) => sum + t.balance, 0);
  }

  get collectionRate(): number {
    if (this.expectedRevenue === 0) return 0;
    return (this.totalRevenue / this.expectedRevenue) * 100;
  }

  get avgRent(): number {
    const occupiedUnitsWithRent = this.units.filter(u => u.status === 'occupied');
    if (occupiedUnitsWithRent.length === 0) return 0;
    return occupiedUnitsWithRent.reduce((sum, u) => sum + u.rent, 0) / occupiedUnitsWithRent.length;
  }

  get avgStay(): number {
    if (this.tenants.length === 0) return 0;
    const now = Date.now();
    const totalMonths = this.tenants.reduce((sum, t) => {
      const start = new Date(t.leaseStart).getTime();
      return sum + Math.max(1, Math.round((now - start) / (1000 * 60 * 60 * 24 * 30)));
    }, 0);
    return Math.round(totalMonths / this.tenants.length);
  }

  get maxChartAmount(): number {
    const values = this.monthlyChartData.flatMap(m => [m.collected, m.expected]);
    return Math.max(...values, 1);
  }

  get unitStatusSegments(): UnitStatusSegment[] {
    const total = this.units.length || 1;
    const segments = [
      { key: 'occupied', label: 'Occupied', count: this.occupiedUnits.length, color: '#10B981' },
      { key: 'vacant', label: 'Vacant', count: this.vacantUnits.length, color: '#F59E0B' },
      { key: 'maintenance', label: 'Maintenance', count: this.maintenanceUnits.length, color: '#EF4444' },
      { key: 'reserved', label: 'Reserved', count: this.units.filter(u => u.status === 'reserved').length, color: '#6366F1' }
    ].filter(s => s.count > 0);

    return segments.map(s => ({
      ...s,
      percent: (s.count / total) * 100
    }));
  }

  get statusDonutGradient(): string {
    const segments = this.unitStatusSegments;
    if (segments.length === 0) {
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

  get paymentYearOptions(): number[] {
    const years = new Set(this.payments.map(p => p.year));
    years.add(this.currentYear);
    return [...years].sort((a, b) => b - a);
  }

  get paginatedUnits(): Unit[] {
    return this.paginate(this.filteredUnits, this.unitsPage);
  }

  get paginatedTenants(): Tenant[] {
    return this.paginate(this.filteredTenants, this.tenantsPage);
  }

  get paginatedPayments(): Payment[] {
    return this.paginate(this.filteredPayments, this.paymentsPage);
  }

  get paginatedIssues(): MaintenanceIssue[] {
    return this.paginate(this.filteredIssues, this.issuesPage);
  }

  get unitsPageCount(): number {
    return this.pageCount(this.filteredUnits.length);
  }

  get tenantsPageCount(): number {
    return this.pageCount(this.filteredTenants.length);
  }

  get paymentsPageCount(): number {
    return this.pageCount(this.filteredPayments.length);
  }

  get issuesPageCount(): number {
    return this.pageCount(this.filteredIssues.length);
  }

  get unitsShowingFrom(): number {
    return this.showingFrom(this.filteredUnits.length, this.unitsPage);
  }

  get unitsShowingTo(): number {
    return this.showingTo(this.filteredUnits.length, this.unitsPage);
  }

  get tenantsShowingFrom(): number {
    return this.showingFrom(this.filteredTenants.length, this.tenantsPage);
  }

  get tenantsShowingTo(): number {
    return this.showingTo(this.filteredTenants.length, this.tenantsPage);
  }

  get paymentsShowingFrom(): number {
    return this.showingFrom(this.filteredPayments.length, this.paymentsPage);
  }

  get paymentsShowingTo(): number {
    return this.showingTo(this.filteredPayments.length, this.paymentsPage);
  }

  get issuesShowingFrom(): number {
    return this.showingFrom(this.filteredIssues.length, this.issuesPage);
  }

  get issuesShowingTo(): number {
    return this.showingTo(this.filteredIssues.length, this.issuesPage);
  }

  get filteredUnits(): Unit[] {
    let filtered = this.units;

    if (this.unitStatusFilter !== 'all') {
      filtered = filtered.filter(u => u.status === this.unitStatusFilter);
    }

    if (this.unitTypeFilter !== 'all') {
      filtered = filtered.filter(u => u.type === this.unitTypeFilter);
    }

    if (this.unitFloorFilter !== 'all') {
      filtered = filtered.filter(u => u.floor === parseInt(this.unitFloorFilter));
    }

    if (this.unitSearchTerm) {
      filtered = filtered.filter(u =>
        u.unitNumber.toLowerCase().includes(this.unitSearchTerm.toLowerCase()) ||
        (u.tenantName && u.tenantName.toLowerCase().includes(this.unitSearchTerm.toLowerCase()))
      );
    }

    return filtered;
  }

  getOpenIssues(): MaintenanceIssue[] {
    return this.issues.filter(issue => issue.status !== 'resolved');
  }

  get filteredTenants(): Tenant[] {
    let filtered = this.tenants;

    if (this.tenantStatusFilter !== 'all') {
      filtered = filtered.filter(t => t.status === this.tenantStatusFilter);
    }

    if (this.tenantBalanceFilter === 'arrears') {
      filtered = filtered.filter(t => t.balance > 0);
    } else if (this.tenantBalanceFilter === 'clear') {
      filtered = filtered.filter(t => t.balance <= 0);
    }

    if (this.tenantSearchTerm) {
      filtered = filtered.filter(t =>
        t.name.toLowerCase().includes(this.tenantSearchTerm.toLowerCase()) ||
        t.unitNumber.toLowerCase().includes(this.tenantSearchTerm.toLowerCase()) ||
        t.phone.includes(this.tenantSearchTerm)
      );
    }

    return filtered;
  }

  get filteredPayments(): Payment[] {
    let filtered = this.payments;

    if (this.paymentStatusFilter !== 'all') {
      filtered = filtered.filter(p => p.status === this.paymentStatusFilter);
    }

    if (this.paymentMonthFilter !== 'all') {
      filtered = filtered.filter(p => p.month === this.paymentMonthFilter);
    }

    if (this.paymentYearFilter !== 'all') {
      filtered = filtered.filter(p => p.year === Number(this.paymentYearFilter));
    }

    if (this.paymentMethodFilter !== 'all') {
      filtered = filtered.filter(p => p.method === this.paymentMethodFilter);
    }

    if (this.paymentSearchTerm) {
      const term = this.paymentSearchTerm.toLowerCase();
      filtered = filtered.filter(p =>
        p.tenantName.toLowerCase().includes(term) ||
        p.unitNumber.toLowerCase().includes(term) ||
        p.receiptNumber.toLowerCase().includes(term)
      );
    }

    return filtered.sort((a, b) => b.date.getTime() - a.date.getTime());
  }

  get filteredIssues(): MaintenanceIssue[] {
    let filtered = this.issues;

    if (this.issueStatusFilter !== 'all') {
      filtered = filtered.filter(i => i.status === this.issueStatusFilter);
    }

    if (this.issuePriorityFilter !== 'all') {
      filtered = filtered.filter(i => i.priority === this.issuePriorityFilter);
    }

    if (this.issueSearchTerm) {
      const term = this.issueSearchTerm.toLowerCase();
      filtered = filtered.filter(i =>
        i.issue.toLowerCase().includes(term) ||
        i.unitNumber.toLowerCase().includes(term) ||
        i.description.toLowerCase().includes(term)
      );
    }

    return filtered.sort((a, b) => b.reportedDate.getTime() - a.reportedDate.getTime());
  }

  get tenantsInArrears(): Tenant[] {
    return this.tenants.filter(t => t.balance > 0);
  }

  get unitTypes(): string[] {
    return [...new Set(this.units.map(u => u.type))];
  }

  get floors(): number[] {
    return [...new Set(this.units.map(u => u.floor))].sort((a, b) => a - b);
  }

  // Helper method to get payments by tenant (replaces pipe)
  getPaymentsByTenant(tenantId: string | null | undefined): Payment[] {
    if (!tenantId) return [];
    return this.payments.filter(payment => payment.tenantId === tenantId);
  }

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private propertyService: PropertyService
  ) {
    this.registerIcons();
  }

  private registerIcons(): void {
    const icons: Record<string, string> = {
      home: HomeIcon,
      building: BuildingIcon,
      pieChart: PieChartIcon,
      banknote: BanknoteIcon,
      fileText: FileTextIcon,
      alert: AlertTriangleIcon,
      user: UserIcon,
      creditCard: CreditCardIcon,
      wrench: WrenchIcon,
      check: CheckCircleIcon,
      logOut: LogOutIcon,
      edit: EditIcon,
      arrowUp: ArrowUpIcon,
      arrowDown: ArrowDownIcon,
      minus: MinusIcon,
      refresh: RefreshCwIcon,
      mail: MailIcon,
      unlock: UnlockIcon
    };

    Object.entries(icons).forEach(([name, svg]) => {
      this.iconRegistry.addSvgIconLiteral(name, this.sanitizer.bypassSecurityTrustHtml(svg));
    });
  }

  getActivityIcon(type: Activity['type']): string {
    const map: Record<Activity['type'], string> = {
      payment: 'banknote',
      tenant_added: 'user',
      issue_reported: 'wrench',
      unit_vacated: 'logOut',
      unit_occupied: 'user',
      maintenance_resolved: 'check',
      lease_terminated: 'fileText',
      unit_updated: 'edit'
    };
    return map[type] || 'fileText';
  }

  ngOnInit(): void {
    this.initializeForms();
    this.rebuildChartData();
    const saved = localStorage.getItem('landlordSidebarCollapsed');
    if (saved !== null) this.sidebarCollapsed = saved === 'true';
    this.route.params.pipe(takeUntil(this.destroy$)).subscribe(params => {
      const id = params['id'];
      if (id) {
        this.loadProperty(Number(id));
      }
    });
    this.route.queryParams.pipe(takeUntil(this.destroy$)).subscribe(params => {
      if (params['tab'] === 'units') {
        this.activeTab = 'units';
      }
      if (params['tab'] === 'settings') {
        this.activeTab = 'settings';
      }
      if (params['vacant'] === '1') {
        this.unitStatusFilter = 'vacant';
        this.onUnitsFilterChange();
      }
    });
  }

  loadProperty(propertyId: number): void {
    if (!propertyId || Number.isNaN(propertyId)) {
      this.loadError = true;
      this.loading = false;
      return;
    }

    this.loading = true;
    this.loadError = false;

    forkJoin({
      property: this.propertyService.getProperty(propertyId),
      units: this.propertyService.listUnits(propertyId)
    }).pipe(takeUntil(this.destroy$)).subscribe({
      next: ({ property, units }) => {
        this.property = this.mapProperty(property);
        this.units = units.map(u => this.mapUnit(u));
        this.property.maintenanceUnits = this.maintenanceUnits.length;
        this.syncTenantsFromUnits();
        this.rebuildChartData();
        this.resetAllPages();
        this.loading = false;
      },
      error: () => {
        this.loadError = true;
        this.loading = false;
      }
    });
  }

  onUnitAdded(): void {
    this.showAddUnitModal = false;
    const id = this.route.snapshot.params['id'];
    if (id) {
      this.loadProperty(Number(id));
    }
  }

  private mapProperty(p: PropertySummary): Property {
    const status = (p.propertyStatus || '').toLowerCase();
    let mappedStatus: Property['status'] = 'active';
    if (status.includes('maintenance') || status.includes('inactive')) {
      mappedStatus = status.includes('maintenance') ? 'under_maintenance' : 'inactive';
    }

    return {
      id: String(p.id),
      name: p.name,
      location: [p.city, p.address].filter(Boolean).join(', ') || p.name,
      county: p.county || '',
      subCounty: p.city || '',
      address: p.address || '',
      status: mappedStatus,
      verified: !!p.verified,
      lastUpdated: new Date(),
      totalUnits: p.totalUnits || 0,
      occupiedUnits: p.occupiedUnits || 0,
      maintenanceUnits: 0,
      totalRevenue: 0,
      expectedRevenue: 0,
      description: p.description || ''
    };
  }

  private mapUnit(u: UnitSummary): Unit {
    const normalizedStatus = (u.status || '').toLowerCase();
    let status: Unit['status'] = 'vacant';
    if (normalizedStatus.includes('occupied')) {
      status = 'occupied';
    } else if (normalizedStatus.includes('maintenance')) {
      status = 'maintenance';
    } else if (normalizedStatus.includes('reserved')) {
      status = 'reserved';
    }

    const unitTypeCode = u.unitType || '';
    return {
      id: String(u.id),
      unitNumber: u.unitNumber,
      type: unitTypeLabel(unitTypeCode),
      unitTypeCode,
      floor: u.floorNumber ?? 0,
      block: u.wing || '',
      status,
      tenantId: status === 'occupied' ? `tenant_${u.id}` : null,
      tenantName: u.tenantName || null,
      rent: u.rent || 0,
      balance: 0,
      size: 0,
      features: []
    };
  }

  private syncTenantsFromUnits(): void {
    const unitNumbers = new Set(this.units.map(u => u.unitNumber));
    const fromUnits: Tenant[] = this.units
      .filter(u => u.status === 'occupied')
      .map(u => {
        const mock = MOCK_TENANTS.find(t => t.unitNumber === u.unitNumber);
        if (mock) {
          return { ...mock, unitId: u.id, unitNumber: u.unitNumber };
        }
        return {
          id: u.tenantId || `tenant_${u.id}`,
          name: u.tenantName || 'Tenant',
          phone: '',
          email: '',
          unitId: u.id,
          unitNumber: u.unitNumber,
          leaseStart: new Date(),
          leaseEnd: null,
          status: 'active' as const,
          balance: u.balance,
          lastPayment: null,
          lastPaymentAmount: 0
        };
      });

    const extras = MOCK_TENANTS.filter(t => !unitNumbers.has(t.unitNumber));
    this.tenants = [...fromUnits, ...extras];
  }

  private rebuildChartData(): void {
    const now = new Date();
    const expected = this.expectedMonthlyRent;
    const points: MonthChartPoint[] = [];

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthIndex = d.getMonth();
      const year = d.getFullYear();
      const monthName = this.monthNames[monthIndex];
      const collected = this.payments
        .filter(p => p.status === 'completed' && p.month === monthName && p.year === year)
        .reduce((sum, p) => sum + p.amount, 0);

      points.push({
        label: `${monthName} ${year}`,
        shortLabel: this.shortMonthNames[monthIndex],
        monthIndex,
        year,
        collected,
        expected,
        collectionRate: expected > 0 ? (collected / expected) * 100 : 0
      });
    }

    this.monthlyChartData = points;
  }

  barHeightPercent(amount: number): number {
    return Math.max(4, (amount / this.maxChartAmount) * 100);
  }

  private paginate<T>(items: T[], page: number): T[] {
    const start = (page - 1) * this.pageSize;
    return items.slice(start, start + this.pageSize);
  }

  private pageCount(totalItems: number): number {
    return Math.max(1, Math.ceil(totalItems / this.pageSize));
  }

  private showingFrom(totalItems: number, page: number): number {
    if (totalItems === 0) return 0;
    return (page - 1) * this.pageSize + 1;
  }

  private showingTo(totalItems: number, page: number): number {
    return Math.min(page * this.pageSize, totalItems);
  }

  onPageSizeChange(): void {
    this.resetAllPages();
  }

  resetAllPages(): void {
    this.unitsPage = 1;
    this.tenantsPage = 1;
    this.paymentsPage = 1;
    this.issuesPage = 1;
  }

  onUnitsFilterChange(): void {
    this.unitsPage = 1;
  }

  onTenantsFilterChange(): void {
    this.tenantsPage = 1;
  }

  onPaymentsFilterChange(): void {
    this.paymentsPage = 1;
  }

  onIssuesFilterChange(): void {
    this.issuesPage = 1;
  }

  goToUnitsPage(page: number): void {
    this.unitsPage = Math.min(Math.max(1, page), this.unitsPageCount);
  }

  goToTenantsPage(page: number): void {
    this.tenantsPage = Math.min(Math.max(1, page), this.tenantsPageCount);
  }

  goToPaymentsPage(page: number): void {
    this.paymentsPage = Math.min(Math.max(1, page), this.paymentsPageCount);
  }

  goToIssuesPage(page: number): void {
    this.issuesPage = Math.min(Math.max(1, page), this.issuesPageCount);
  }

  clearUnitFilters(): void {
    this.unitSearchTerm = '';
    this.unitStatusFilter = 'all';
    this.unitTypeFilter = 'all';
    this.unitFloorFilter = 'all';
    this.onUnitsFilterChange();
  }

  clearTenantFilters(): void {
    this.tenantSearchTerm = '';
    this.tenantStatusFilter = 'all';
    this.tenantBalanceFilter = 'all';
    this.onTenantsFilterChange();
  }

  clearPaymentFilters(): void {
    this.paymentSearchTerm = '';
    this.paymentStatusFilter = 'all';
    this.paymentMonthFilter = 'all';
    this.paymentYearFilter = 'all';
    this.paymentMethodFilter = 'all';
    this.onPaymentsFilterChange();
  }

  clearIssueFilters(): void {
    this.issueSearchTerm = '';
    this.issueStatusFilter = 'all';
    this.issuePriorityFilter = 'all';
    this.onIssuesFilterChange();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();

  }

  initializeForms(): void {
    this.addTenantForm = this.fb.group({
      name: ['', Validators.required],
      phone: ['', [Validators.required, Validators.pattern('^254[0-9]{9}$')]],
      email: ['', [Validators.required, Validators.email]],
      unitId: ['', Validators.required],
      leaseStart: ['', Validators.required],
      rent: ['', [Validators.required, Validators.min(0)]]
    });

    this.recordPaymentForm = this.fb.group({
      tenantId: ['', Validators.required],
      amount: ['', [Validators.required, Validators.min(0)]],
      method: ['mpesa', Validators.required],
      month: ['', Validators.required],
      year: [new Date().getFullYear(), Validators.required]
    });

    this.addIssueForm = this.fb.group({
      unitId: ['', Validators.required],
      issue: ['', Validators.required],
      description: [''],
      priority: ['medium', Validators.required],
      estimatedCost: [0]
    });

    this.editUnitForm = this.fb.group({
      unitType: ['', Validators.required],
      floor: [null, [Validators.min(0)]],
      rent: ['', [Validators.required, Validators.min(0)]],
      status: ['', Validators.required]
    });
  }

  setActiveTab(tab: string): void {
    this.activeTab = tab;
  }

  viewUnit(unit: Unit): void {
    this.selectedUnit = unit;
    this.editUnitForm.patchValue({
      unitType: unit.unitTypeCode || '',
      floor: unit.floor || null,
      rent: unit.rent,
      status: unit.status
    });
    this.showEditUnitModal = true;
  }

  configureListing(unit: Unit): void {
    this.router.navigate(['/landlord/properties', this.property.id, 'house-hunt'], {
      queryParams: { unitId: unit.id }
    });
  }

  openHouseHuntSetup(): void {
    this.router.navigate(['/landlord/properties', this.property.id, 'house-hunt']);
  }

  openVacantUnitsTab(): void {
    this.setActiveTab('units');
    this.unitStatusFilter = 'vacant';
    this.onUnitsFilterChange();
  }

  editUnit(): void {
    if (!this.editUnitForm.valid || !this.selectedUnit || this.editUnitSaving) {
      return;
    }

    const unitNumber = this.selectedUnit.unitNumber;
    const formValue = this.editUnitForm.value;
    const statusMap: Record<string, string> = {
      vacant: 'VACANT',
      occupied: 'OCCUPIED',
      maintenance: 'MAINTENANCE',
      reserved: 'RESERVED'
    };

    this.editUnitSaving = true;
    this.propertyService.updateUnit(+this.property.id, +this.selectedUnit.id, {
      unitType: formValue.unitType,
      floorNumber: formValue.floor ?? undefined,
      rent: formValue.rent,
      status: statusMap[formValue.status] || formValue.status?.toUpperCase()
    }).subscribe({
      next: (updated) => {
        const mapped = this.mapUnit(updated);
        const index = this.units.findIndex(u => u.id === this.selectedUnit!.id);
        if (index >= 0) {
          this.units[index] = mapped;
        }
        this.editUnitSaving = false;
        this.showEditUnitModal = false;
        this.addActivity('unit_updated', `Unit ${unitNumber} updated`, unitNumber);
        this.selectedUnit = null;
      },
      error: (err: Error) => {
        this.editUnitSaving = false;
        alert(err.message || 'Failed to update unit');
      }
    });
  }

  assignTenantToUnit(unit: Unit): void {
    this.addTenantForm.patchValue({ unitId: unit.id });
    this.showAddTenantModal = true;
  }

  markUnitVacant(unit: Unit): void {
    if (confirm(`Mark unit ${unit.unitNumber} as vacant? This will remove the current tenant.`)) {
      const tenant = this.tenants.find(t => t.unitId === unit.id);
      if (tenant) {
        tenant.status = 'inactive';
        tenant.leaseEnd = new Date();
      }
      unit.status = 'vacant';
      unit.tenantId = null;
      unit.tenantName = null;
      this.addActivity('unit_vacated', `Unit ${unit.unitNumber} marked as vacant`, unit.unitNumber);
    }
  }

  viewTenantProfile(tenant: Tenant): void {
    this.selectedTenant = tenant;
    this.showTenantProfileModal = true;
  }

  addTenant(): void {
    if (this.addTenantForm.valid) {
      const unit = this.units.find(u => u.id === this.addTenantForm.value.unitId);
      if (unit && unit.status === 'vacant') {
        const newTenant: Tenant = {
          id: `tenant_${Date.now()}`,
          name: this.addTenantForm.value.name,
          phone: this.addTenantForm.value.phone,
          email: this.addTenantForm.value.email,
          unitId: unit.id,
          unitNumber: unit.unitNumber,
          leaseStart: new Date(this.addTenantForm.value.leaseStart),
          leaseEnd: null,
          status: 'active',
          balance: 0,
          lastPayment: null,
          lastPaymentAmount: 0
        };

        this.tenants.push(newTenant);
        unit.status = 'occupied';
        unit.tenantId = newTenant.id;
        unit.tenantName = newTenant.name;

        this.addActivity('tenant_added', `New tenant ${newTenant.name} added to unit ${unit.unitNumber}`, unit.unitNumber, newTenant.name);
        this.showAddTenantModal = false;
        this.addTenantForm.reset();
      }
    }
  }

  terminateLease(tenant: Tenant): void {
    if (confirm(`Terminate lease for ${tenant.name}?`)) {
      tenant.status = 'inactive';
      tenant.leaseEnd = new Date();
      const unit = this.units.find(u => u.id === tenant.unitId);
      if (unit) {
        unit.status = 'vacant';
        unit.tenantId = null;
        unit.tenantName = null;
      }
      this.addActivity('lease_terminated', `Lease terminated for ${tenant.name}`, undefined, tenant.name);
    }
  }

  recordPayment(): void {
    if (this.recordPaymentForm.valid) {
      const tenant = this.tenants.find(t => t.id === this.recordPaymentForm.value.tenantId);
      if (tenant) {
        const amount = this.recordPaymentForm.value.amount;
        const unit = this.units.find(u => u.id === tenant.unitId);

        const newPayment: Payment = {
          id: `pay_${Date.now()}`,
          date: new Date(),
          tenantId: tenant.id,
          tenantName: tenant.name,
          unitId: tenant.unitId,
          unitNumber: tenant.unitNumber,
          amount: amount,
          method: this.recordPaymentForm.value.method,
          status: 'completed',
          receiptNumber: `RCP-${Date.now()}`,
          month: this.recordPaymentForm.value.month,
          year: this.recordPaymentForm.value.year
        };

        this.payments.push(newPayment);
        this.rebuildChartData();

        tenant.balance = Math.max(0, tenant.balance - amount);
        tenant.lastPayment = new Date();
        tenant.lastPaymentAmount = amount;

        if (unit) {
          unit.balance = Math.max(0, unit.balance - amount);
        }

        this.addActivity('payment', `Payment of KES ${amount.toLocaleString()} received from ${tenant.name}`, tenant.unitNumber, tenant.name, amount);
        this.showRecordPaymentModal = false;
        this.recordPaymentForm.reset({ method: 'mpesa', year: new Date().getFullYear() });
      }
    }
  }

  downloadReceipt(payment: Payment): void {
    alert(`Downloading receipt ${payment.receiptNumber} for ${payment.tenantName}`);
  }

  addIssue(): void {
    if (this.addIssueForm.valid) {
      const unit = this.units.find(u => u.id === this.addIssueForm.value.unitId);
      if (unit) {
        const newIssue: MaintenanceIssue = {
          id: `issue_${Date.now()}`,
          unitId: unit.id,
          unitNumber: unit.unitNumber,
          issue: this.addIssueForm.value.issue,
          description: this.addIssueForm.value.description,
          status: 'pending',
          priority: this.addIssueForm.value.priority,
          reportedDate: new Date(),
          resolvedDate: null,
          assignedTo: null,
          estimatedCost: this.addIssueForm.value.estimatedCost || 0,
          actualCost: 0
        };

        this.issues.push(newIssue);

        if (unit.status !== 'maintenance') {
          unit.status = 'maintenance';
        }

        this.addActivity('issue_reported', `Maintenance issue reported for unit ${unit.unitNumber}: ${newIssue.issue}`, unit.unitNumber);
        this.showAddIssueModal = false;
        this.addIssueForm.reset({ priority: 'medium' });
      }
    }
  }

  resolveIssue(issue: MaintenanceIssue): void {
    if (confirm(`Mark issue "${issue.issue}" as resolved?`)) {
      issue.status = 'resolved';
      issue.resolvedDate = new Date();

      const hasOtherIssues = this.issues.some(i => i.unitId === issue.unitId && i.status !== 'resolved');
      if (!hasOtherIssues) {
        const unit = this.units.find(u => u.id === issue.unitId);
        if (unit && unit.status === 'maintenance') {
          unit.status = 'vacant';
        }
      }

      this.addActivity('maintenance_resolved', `Maintenance issue resolved for unit ${issue.unitNumber}: ${issue.issue}`, issue.unitNumber);
    }
  }

  private addActivity(type: string, description: string, unitNumber?: string, tenantName?: string, amount?: number): void {
    const newActivity: Activity = {
      id: `act_${Date.now()}`,
      type: type as any,
      description: description,
      timestamp: new Date(),
      unitNumber: unitNumber,
      tenantName: tenantName,
      amount: amount
    };
    this.activities.unshift(newActivity);
    if (this.activities.length > 50) {
      this.activities.pop();
    }
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES', minimumFractionDigits: 0 }).format(amount);
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('en-KE');
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

  get previousOccupancyRate(): number {
    if (this.monthlyChartData.length < 2) return this.occupancyRate;
    return this.occupancyRate;
  }

  get previousTotalRevenue(): number {
    if (this.monthlyChartData.length < 2) return 0;
    return this.monthlyChartData[this.monthlyChartData.length - 2].collected;
  }

  get previousOutstandingRent(): number {
    return this.outstandingRent;
  }

  get previousCollectionRate(): number {
    if (this.monthlyChartData.length < 2) return this.collectionRate;
    return this.monthlyChartData[this.monthlyChartData.length - 2].collectionRate;
  }

  closeModal(modalName: string): void {
    (this as any)[modalName] = false;
  }
}
import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subject, debounceTime, forkJoin, takeUntil } from 'rxjs';
import { LandlordService, LandlordTenantSummary, LandlordInvitationSummary } from '../../../../core/services/landlord.service';

interface TenantRow {
  id: string;
  tenantId: string;
  unitId: number;
  propertyId: number;
  name: string;
  phone: string;
  unitRef: string;
  propertyName: string;
  floorNumber?: number;
  wing?: string;
  monthlyRent: number;
  rentDueDay?: number;
  kycStatus: string;
  status: string;
  kind: 'tenancy' | 'pending';
  expiresAt?: string;
}

interface PropertyFilterOption {
  id: number;
  name: string;
}

@Component({
  selector: 'app-landlord-tenants-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './list.html',
  styleUrls: ['./list.css']
})
export class LandlordTenantsListComponent implements OnInit, OnDestroy {
  loading = true;
  rows: TenantRow[] = [];
  filteredRows: TenantRow[] = [];
  propertyOptions: PropertyFilterOption[] = [];

  searchTerm = '';
  filterStatus = 'all';
  filterPropertyId = 'all';
  filterFloor = 'all';

  page = 1;
  readonly pageSize = 15;

  private search$ = new Subject<string>();
  private destroy$ = new Subject<void>();

  constructor(private router: Router, private landlordService: LandlordService) {}

  ngOnInit(): void {
    this.search$.pipe(debounceTime(300), takeUntil(this.destroy$)).subscribe(() => this.loadData());
    this.loadData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get showFloorFilter(): boolean {
    return this.filterPropertyId !== 'all';
  }

  get availableFloors(): number[] {
    if (this.filterPropertyId === 'all') return [];
    const pid = Number(this.filterPropertyId);
    const floors = this.rows
      .filter(r => r.propertyId === pid && r.floorNumber != null)
      .map(r => r.floorNumber as number);
    return [...new Set(floors)].sort((a, b) => a - b);
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.filteredRows.length / this.pageSize));
  }

  get paginatedRows(): TenantRow[] {
    const start = (this.page - 1) * this.pageSize;
    return this.filteredRows.slice(start, start + this.pageSize);
  }

  get showingFrom(): number {
    if (this.filteredRows.length === 0) return 0;
    return (this.page - 1) * this.pageSize + 1;
  }

  get showingTo(): number {
    return Math.min(this.page * this.pageSize, this.filteredRows.length);
  }

  onSearchChange(): void {
    this.search$.next(this.searchTerm);
  }

  onPropertyFilterChange(): void {
    this.filterFloor = 'all';
    this.page = 1;
    this.loadData();
  }

  onFloorFilterChange(): void {
    this.page = 1;
    this.loadData();
  }

  onStatusFilterChange(): void {
    this.page = 1;
    this.applyLocalFilters();
  }

  loadData(): void {
    this.loading = true;
    const params: { propertyId?: number; floor?: number; search?: string } = {};
    if (this.filterPropertyId !== 'all') params.propertyId = Number(this.filterPropertyId);
    if (this.showFloorFilter && this.filterFloor !== 'all') params.floor = Number(this.filterFloor);
    if (this.searchTerm.trim()) params.search = this.searchTerm.trim();

    forkJoin({
      tenants: this.landlordService.listTenants(params),
      invites: this.landlordService.listPendingInvitations(params)
    }).subscribe({
      next: ({ tenants, invites }) => {
        this.rows = [
          ...tenants.map(t => this.mapTenancy(t)),
          ...invites.map(i => this.mapInvite(i))
        ];
        this.buildPropertyOptions(tenants, invites);
        this.applyLocalFilters();
        this.loading = false;
      },
      error: () => {
        this.rows = [];
        this.filteredRows = [];
        this.propertyOptions = [];
        this.loading = false;
      }
    });
  }

  private buildPropertyOptions(tenants: LandlordTenantSummary[], invites: LandlordInvitationSummary[]): void {
    const map = new Map<number, string>();
    for (const t of tenants) map.set(t.propertyId, t.propertyName);
    for (const i of invites) map.set(i.propertyId, i.propertyName);
    this.propertyOptions = [...map.entries()]
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  private mapTenancy(t: LandlordTenantSummary): TenantRow {
    return {
      id: 't-' + t.tenancyId,
      tenantId: String(t.tenantId),
      unitId: t.unitId,
      propertyId: t.propertyId,
      name: t.tenantName,
      phone: t.tenantPhone,
      unitRef: t.unitNumber,
      propertyName: t.propertyName,
      floorNumber: t.floorNumber,
      wing: t.wing,
      monthlyRent: t.monthlyRent,
      rentDueDay: t.rentDueDay,
      kycStatus: (t.kycStatus || 'PENDING').toLowerCase(),
      status: (t.tenancyStatus || 'ACTIVE').toLowerCase(),
      kind: 'tenancy'
    };
  }

  private mapInvite(i: LandlordInvitationSummary): TenantRow {
    return {
      id: 'i-' + i.code,
      tenantId: i.code,
      unitId: i.unitId,
      propertyId: i.propertyId,
      name: i.tenantName,
      phone: i.tenantPhone,
      unitRef: i.unitNumber,
      propertyName: i.propertyName,
      floorNumber: i.floorNumber,
      wing: i.wing,
      monthlyRent: i.monthlyRent,
      rentDueDay: i.rentDueDay,
      kycStatus: i.existingTenant ? 'approved' : 'pending',
      status: 'pending_invite',
      kind: 'pending',
      expiresAt: i.expiresAt
    };
  }

  get hasNoTenants(): boolean {
    return this.rows.length === 0 && !this.loading;
  }

  get isFilteredEmpty(): boolean {
    return this.rows.length > 0 && this.filteredRows.length === 0;
  }

  viewTenant(tenantId: string): void {
    this.router.navigate(['/landlord/tenants', tenantId]);
  }

  viewUnit(unitId: number, event: Event): void {
    event.stopPropagation();
    this.router.navigate(['/landlord/units', unitId]);
  }

  applyLocalFilters(): void {
    let filtered = [...this.rows];
    if (this.filterStatus === 'active') {
      filtered = filtered.filter(r => r.kind === 'tenancy' && r.status === 'active');
    } else if (this.filterStatus === 'pending_invite') {
      filtered = filtered.filter(r => r.kind === 'pending');
    } else if (this.filterStatus === 'kyc_pending') {
      filtered = filtered.filter(r => r.kycStatus === 'pending' || r.kycStatus === 'manual_review');
    }
    this.filteredRows = filtered;
    if (this.page > this.totalPages) this.page = this.totalPages;
  }

  resetFilters(): void {
    this.searchTerm = '';
    this.filterStatus = 'all';
    this.filterPropertyId = 'all';
    this.filterFloor = 'all';
    this.page = 1;
    this.loadData();
  }

  prevPage(): void {
    if (this.page > 1) this.page--;
  }

  nextPage(): void {
    if (this.page < this.totalPages) this.page++;
  }

  locationLabel(row: TenantRow): string {
    const parts: string[] = [];
    if (row.wing) parts.push(row.wing);
    if (row.floorNumber != null) parts.push(`Floor ${row.floorNumber}`);
    return parts.length ? parts.join(' · ') : '—';
  }

  formatRentDue(day?: number): string {
    if (!day) return '—';
    const suffix = day >= 11 && day <= 13 ? 'th' :
      day % 10 === 1 ? 'st' : day % 10 === 2 ? 'nd' : day % 10 === 3 ? 'rd' : 'th';
    return `${day}${suffix}`;
  }

  getKycBadgeClass(status: string): string {
    if (status === 'approved' || status === 'verified') return 'success';
    if (status === 'pending' || status === 'manual_review') return 'warning';
    if (status === 'rejected') return 'danger';
    return 'info';
  }

  getKycText(status: string): string {
    if (status === 'approved' || status === 'verified') return 'Verified';
    if (status === 'pending') return 'KYC Pending';
    if (status === 'manual_review') return 'Manual Review';
    if (status === 'rejected') return 'Rejected';
    return status;
  }
}

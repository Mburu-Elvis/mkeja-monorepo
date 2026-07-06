import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AdminService, AdminTenancyDetail } from '../../../../core/services/admin.service';
import { UnitSummary } from '../../../../core/services/property.service';

@Component({
  selector: 'app-admin-tenancies-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './list.html',
  styleUrls: ['./list.css']
})
export class AdminTenanciesListComponent implements OnInit {
  loading = true;
  error = '';
  tenancies: AdminTenancyDetail[] = [];
  filtered: AdminTenancyDetail[] = [];
  searchTerm = '';
  filterStatus = 'all';
  actingId: number | null = null;
  reassignTarget: AdminTenancyDetail | null = null;
  reassignUnitId: number | null = null;
  vacantUnits: UnitSummary[] = [];
  loadingVacantUnits = false;

  constructor(
    private adminService: AdminService,
    private snackBar: MatSnackBar,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      if (params['search']) {
        this.searchTerm = String(params['search']);
      }
      this.load();
    });
  }

  load(): void {
    this.loading = true;
    this.error = '';
    this.adminService.listTenancies({
      status: this.filterStatus !== 'all' ? this.filterStatus : undefined,
      search: this.searchTerm.trim() || undefined
    }).subscribe({
      next: (items) => {
        this.tenancies = items;
        this.filtered = items;
        this.loading = false;
      },
      error: (err: Error) => {
        this.error = err.message;
        this.loading = false;
      }
    });
  }

  onSearch(): void {
    this.load();
  }

  get hasActiveFilters(): boolean {
    return !!this.searchTerm.trim() || this.filterStatus !== 'all';
  }

  get activeCount(): number {
    return this.tenancies.filter(t => t.status === 'ACTIVE').length;
  }

  get pendingCount(): number {
    return this.tenancies.filter(t => t.status === 'PENDING').length;
  }

  get totalRentRoll(): number {
    return this.tenancies
      .filter(t => t.status === 'ACTIVE')
      .reduce((sum, t) => sum + (t.monthlyRent || 0), 0);
  }

  resetFilters(): void {
    this.searchTerm = '';
    this.filterStatus = 'all';
    this.load();
  }

  terminate(tenancy: AdminTenancyDetail): void {
    if (!confirm(`Terminate tenancy for ${tenancy.tenantName} on unit ${tenancy.unitNumber}?`)) return;
    if (this.actingId !== null) return;
    this.actingId = tenancy.id;
    this.adminService.terminateTenancy(tenancy.id).subscribe({
      next: (updated) => {
        this.tenancies = this.tenancies.map(t => t.id === tenancy.id ? updated : t);
        this.filtered = [...this.tenancies];
        this.actingId = null;
        this.snackBar.open('Tenancy terminated.', 'Close', { duration: 3500 });
      },
      error: (err: Error) => {
        this.error = err.message;
        this.actingId = null;
      }
    });
  }

  openReassign(tenancy: AdminTenancyDetail): void {
    this.reassignTarget = tenancy;
    this.reassignUnitId = null;
    this.vacantUnits = [];
    this.error = '';
    if (!tenancy.propertyId) {
      this.error = 'Property ID missing — enter target unit ID manually if needed.';
      return;
    }
    this.loadingVacantUnits = true;
    this.adminService.listVacantUnits(tenancy.propertyId).subscribe({
      next: (units) => {
        this.vacantUnits = units.filter(u => u.id !== tenancy.unitId);
        this.loadingVacantUnits = false;
      },
      error: (err: Error) => {
        this.error = err.message;
        this.loadingVacantUnits = false;
      }
    });
  }

  closeReassign(): void {
    this.reassignTarget = null;
    this.reassignUnitId = null;
    this.vacantUnits = [];
  }

  confirmReassign(): void {
    if (!this.reassignTarget || !this.reassignUnitId) return;
    if (this.actingId !== null) return;
    this.actingId = this.reassignTarget.id;
    this.adminService.reassignTenancy(this.reassignTarget.id, this.reassignUnitId).subscribe({
      next: (updated) => {
        this.tenancies = this.tenancies.map(t => t.id === updated.id ? updated : t);
        this.filtered = [...this.tenancies];
        this.actingId = null;
        this.closeReassign();
        this.snackBar.open('Tenancy reassigned.', 'Close', { duration: 3500 });
      },
      error: (err: Error) => {
        this.error = err.message;
        this.actingId = null;
      }
    });
  }

  statusClass(status?: string): string {
    switch ((status || '').toUpperCase()) {
      case 'ACTIVE': return 'success';
      case 'PENDING': return 'warning';
      case 'TERMINATED': return 'danger';
      case 'EXPIRED': return 'neutral';
      default: return 'neutral';
    }
  }

  statusLabel(status?: string): string {
    switch ((status || '').toUpperCase()) {
      case 'ACTIVE': return 'Active';
      case 'PENDING': return 'Pending';
      case 'TERMINATED': return 'Terminated';
      case 'EXPIRED': return 'Expired';
      default: return status || 'Unknown';
    }
  }

  isActionable(status?: string): boolean {
    const value = (status || '').toUpperCase();
    return value === 'ACTIVE' || value === 'PENDING';
  }
}

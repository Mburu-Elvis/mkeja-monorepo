import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AdminService } from '../../../../core/services/admin.service';
import { PropertySummary } from '../../../../core/services/property.service';

@Component({
  selector: 'app-admin-properties-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './list.html',
  styleUrls: ['./list.css']
})
export class AdminPropertiesListComponent implements OnInit {
  loading = true;
  error = '';
  properties: PropertySummary[] = [];
  filtered: PropertySummary[] = [];
  searchTerm = '';
  filterStatus = 'all';
  verifyingPropertyId: number | null = null;
  rejectingPropertyId: number | null = null;
  deletingPropertyId: number | null = null;

  constructor(
    private adminService: AdminService,
    private snackBar: MatSnackBar,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.load();
  }

  get verifiedCount(): number {
    return this.properties.filter(p => p.propertyStatus === 'VERIFIED').length;
  }

  get pendingCount(): number {
    return this.properties.filter(p => p.propertyStatus === 'PENDING_VERIFICATION').length;
  }

  get totalUnits(): number {
    return this.properties.reduce((sum, p) => sum + (p.totalUnits || 0), 0);
  }

  get hasActiveFilters(): boolean {
    return !!this.searchTerm.trim() || this.filterStatus !== 'all';
  }

  load(): void {
    this.loading = true;
    this.error = '';
    this.adminService.listProperties(this.filterStatus !== 'all' ? this.filterStatus : undefined).subscribe({
      next: (items) => {
        this.properties = items;
        this.applyFilters();
        this.loading = false;
      },
      error: (err: Error) => {
        this.error = err.message;
        this.loading = false;
      }
    });
  }

  applyFilters(): void {
    let rows = [...this.properties];
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase();
      rows = rows.filter(p =>
        p.name.toLowerCase().includes(term) ||
        (p.address || '').toLowerCase().includes(term) ||
        (p.city || '').toLowerCase().includes(term) ||
        String(p.id).includes(term)
      );
    }
    this.filtered = rows;
  }

  resetFilters(): void {
    this.searchTerm = '';
    this.filterStatus = 'all';
    this.load();
  }

  openProperty(propertyId: number): void {
    this.router.navigate(['/admin/properties', propertyId]);
  }

  statusLabel(status?: string): string {
    switch ((status || '').toUpperCase()) {
      case 'VERIFIED': return 'Verified';
      case 'PENDING_VERIFICATION': return 'Pending review';
      case 'REJECTED': return 'Rejected';
      case 'DRAFT': return 'Draft';
      default: return status || 'Unknown';
    }
  }

  verifyProperty(propertyId: number): void {
    if (this.verifyingPropertyId !== null) return;
    this.verifyingPropertyId = propertyId;
    this.adminService.verifyProperty(propertyId).subscribe({
      next: (updated) => {
        this.properties = this.properties.map(p => p.id === propertyId ? { ...p, ...updated, verified: true, propertyStatus: 'VERIFIED' } : p);
        this.applyFilters();
        this.verifyingPropertyId = null;
        this.snackBar.open(`${updated.name} verified.`, 'Close', { duration: 3500 });
      },
      error: (err: Error) => {
        this.error = err.message;
        this.verifyingPropertyId = null;
      }
    });
  }

  rejectProperty(propertyId: number): void {
    if (!confirm('Reject this property? It will be hidden from House Hunt.')) return;
    if (this.rejectingPropertyId !== null) return;
    this.rejectingPropertyId = propertyId;
    this.adminService.rejectProperty(propertyId).subscribe({
      next: (updated) => {
        this.properties = this.properties.map(p => p.id === propertyId ? { ...p, ...updated, verified: false, propertyStatus: 'REJECTED' } : p);
        this.applyFilters();
        this.rejectingPropertyId = null;
        this.snackBar.open(`${updated.name} rejected.`, 'Close', { duration: 3500 });
      },
      error: (err: Error) => {
        this.error = err.message;
        this.rejectingPropertyId = null;
      }
    });
  }

  deleteProperty(propertyId: number): void {
    const name = this.properties.find(p => p.id === propertyId)?.name || 'this property';
    if (!confirm(`Delete ${name}? This removes units, photos, tenancies, and invitations.`)) return;
    if (this.deletingPropertyId !== null) return;
    this.deletingPropertyId = propertyId;
    this.adminService.deleteProperty(propertyId).subscribe({
      next: () => {
        this.properties = this.properties.filter(p => p.id !== propertyId);
        this.applyFilters();
        this.deletingPropertyId = null;
        this.snackBar.open(`${name} deleted.`, 'Close', { duration: 3500 });
      },
      error: (err: Error) => {
        this.error = err.message;
        this.deletingPropertyId = null;
      }
    });
  }

  statusClass(status?: string): string {
    switch ((status || '').toUpperCase()) {
      case 'VERIFIED': return 'success';
      case 'PENDING_VERIFICATION': return 'warning';
      case 'REJECTED': return 'danger';
      default: return 'neutral';
    }
  }
}

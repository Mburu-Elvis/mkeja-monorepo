import { Component, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AdminService, AdminUserSummary, KycApplication } from '../../../../core/services/admin.service';
import { PropertySummary } from '../../../../core/services/property.service';

type KycTab = 'applications' | 'properties' | 'users';

@Component({
  selector: 'app-admin-kyc-queue-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './list.html',
  styleUrls: ['./list.css']
})
export class AdminKycQueueListComponent implements OnInit {
  private cdr = inject(ChangeDetectorRef);
  private snackBar = inject(MatSnackBar);

  activeTab: KycTab = 'applications';
  loading = true;
  error = '';
  applications: KycApplication[] = [];
  filteredApplications: KycApplication[] = [];
  allProperties: PropertySummary[] = [];
  filteredProperties: PropertySummary[] = [];
  kycUsers: AdminUserSummary[] = [];
  filteredKycUsers: AdminUserSummary[] = [];

  filterStatus = 'all';
  filterApplicantType = 'all';
  filterPropertyStatus = 'PENDING_VERIFICATION';
  filterUserKyc = 'all';
  searchTerm = '';
  verifyingPropertyId: number | null = null;
  deletingPropertyId: number | null = null;

  constructor(
    private router: Router,
    private adminService: AdminService
  ) {}

  ngOnInit() {
    this.loadApplications();
    this.loadProperties();
    this.loadKycUsers();
  }

  setActiveTab(tab: KycTab) {
    this.activeTab = tab;
    this.resetFilters();
  }

  get pendingCount(): number {
    return this.applications.filter(a => a.status === 'pending').length;
  }

  get reviewCount(): number {
    return this.applications.filter(a => a.status === 'manual_review').length;
  }

  get pendingPropertyCount(): number {
    return this.allProperties.filter(p => (p.propertyStatus || '').toUpperCase() === 'PENDING_VERIFICATION').length;
  }

  get kycUserActionCount(): number {
    return this.kycUsers.filter(u =>
      u.kycStatus === 'PENDING' || u.kycStatus === 'MANUAL_REVIEW'
    ).length;
  }

  loadApplications() {
    this.loading = true;
    this.error = '';
    this.adminService.listKycApplications().subscribe({
      next: (apps) => {
        this.applications = apps;
        this.applyApplicationFilters();
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.error = err.message;
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }

  loadProperties() {
    this.adminService.listProperties('all').subscribe({
      next: (properties) => {
        this.allProperties = properties;
        this.applyPropertyFilters();
        this.cdr.markForCheck();
      }
    });
  }

  loadKycUsers() {
    this.adminService.listUsers().subscribe({
      next: (users) => {
        this.kycUsers = users.filter(u => u.role === 'LANDLORD' || u.role === 'TENANT' || u.role === 'AGENT');
        this.applyUserFilters();
        this.cdr.markForCheck();
      }
    });
  }

  verifyProperty(propertyId: number, event?: Event) {
    event?.stopPropagation();
    if (this.verifyingPropertyId !== null) return;
    this.verifyingPropertyId = propertyId;
    this.adminService.verifyProperty(propertyId).subscribe({
      next: () => {
        const name = this.allProperties.find(p => p.id === propertyId)?.name || 'Property';
        this.allProperties = this.allProperties.map(p =>
          p.id === propertyId ? { ...p, propertyStatus: 'VERIFIED', verified: true } : p
        );
        this.applyPropertyFilters();
        this.verifyingPropertyId = null;
        this.snackBar.open(`${name} verified.`, 'Close', { duration: 4000 });
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.error = err.message;
        this.verifyingPropertyId = null;
        this.cdr.markForCheck();
      }
    });
  }

  deleteProperty(propertyId: number, event?: Event) {
    event?.stopPropagation();
    const name = this.allProperties.find(p => p.id === propertyId)?.name || 'this property';
    if (!confirm(`Delete ${name}? This removes units, photos, tenancies, and invitations.`)) {
      return;
    }
    if (this.deletingPropertyId !== null) return;
    this.deletingPropertyId = propertyId;
    this.adminService.deleteProperty(propertyId).subscribe({
      next: () => {
        this.allProperties = this.allProperties.filter(p => p.id !== propertyId);
        this.applyPropertyFilters();
        this.deletingPropertyId = null;
        this.snackBar.open(`${name} deleted.`, 'Close', { duration: 4000 });
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.error = err.message;
        this.deletingPropertyId = null;
        this.cdr.markForCheck();
      }
    });
  }

  applyApplicationFilters() {
    let filtered = [...this.applications];
    if (this.filterStatus !== 'all') {
      filtered = filtered.filter(a => a.status === this.filterStatus);
    }
    if (this.filterApplicantType !== 'all') {
      filtered = filtered.filter(a => a.applicantType === this.filterApplicantType);
    }
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(a =>
        a.fullName.toLowerCase().includes(term) ||
        a.idNumber.includes(term) ||
        (a.landlordName || '').toLowerCase().includes(term) ||
        (a.phone || '').includes(term) ||
        (a.email || '').toLowerCase().includes(term)
      );
    }
    this.filteredApplications = filtered;
  }

  applyPropertyFilters() {
    let filtered = [...this.allProperties];
    if (this.filterPropertyStatus !== 'all') {
      filtered = filtered.filter(p => (p.propertyStatus || '').toUpperCase() === this.filterPropertyStatus);
    }
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(term) ||
        (p.address || '').toLowerCase().includes(term) ||
        (p.city || '').toLowerCase().includes(term)
      );
    }
    this.filteredProperties = filtered;
  }

  applyUserFilters() {
    let filtered = [...this.kycUsers];
    if (this.filterUserKyc !== 'all') {
      filtered = filtered.filter(u => u.kycStatus === this.filterUserKyc);
    }
    if (this.filterApplicantType !== 'all') {
      filtered = filtered.filter(u => {
        if (this.filterApplicantType === 'LANDLORD') return u.role === 'LANDLORD';
        if (this.filterApplicantType === 'AGENT') return u.role === 'AGENT';
        return u.role === 'TENANT';
      });
    }
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(u =>
        u.fullName.toLowerCase().includes(term) ||
        u.phone.includes(term) ||
        (u.email || '').toLowerCase().includes(term)
      );
    }
    this.filteredKycUsers = filtered;
  }

  onFilterChange() {
    if (this.activeTab === 'applications') this.applyApplicationFilters();
    else if (this.activeTab === 'properties') this.applyPropertyFilters();
    else this.applyUserFilters();
  }

  resetFilters() {
    this.searchTerm = '';
    this.filterStatus = 'all';
    this.filterApplicantType = 'all';
    this.filterPropertyStatus = 'PENDING_VERIFICATION';
    this.filterUserKyc = 'all';
    this.onFilterChange();
  }

  viewApplication(app: KycApplication) {
    this.router.navigate(['/admin/kyc-queue', app.id], {
      queryParams: { type: app.applicantType }
    });
  }

  viewUser(user: AdminUserSummary) {
    this.router.navigate(['/admin/users', user.id]);
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'approved': return 'success';
      case 'pending': return 'pending';
      case 'manual_review': return 'review';
      case 'rejected': return 'rejected';
      default: return 'info';
    }
  }

  getStatusText(status: string): string {
    switch (status) {
      case 'approved': return 'Approved';
      case 'pending': return 'Pending';
      case 'manual_review': return 'Manual Review';
      case 'rejected': return 'Rejected';
      default: return status;
    }
  }

  getPropertyStatusClass(status?: string): string {
    switch ((status || '').toUpperCase()) {
      case 'VERIFIED': return 'success';
      case 'PENDING_VERIFICATION': return 'pending';
      case 'REJECTED': return 'rejected';
      default: return 'info';
    }
  }

  getApplicantLabel(type: string): string {
    if (type === 'LANDLORD') return 'Landlord KYC';
    if (type === 'AGENT') return 'Agent KYC';
    return 'Tenant KYC';
  }

  getKycBadgeClass(status: string): string {
    switch (status) {
      case 'APPROVED': return 'success';
      case 'PENDING': return 'pending';
      case 'MANUAL_REVIEW': return 'review';
      case 'REJECTED': return 'rejected';
      default: return 'info';
    }
  }
}

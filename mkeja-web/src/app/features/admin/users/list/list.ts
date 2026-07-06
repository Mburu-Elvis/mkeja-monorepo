import { Component, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ToastComponent } from '../../../../shared/components/toast/toast';
import { AdminService, AdminUserSummary, CreateAdminRequest } from '../../../../core/services/admin.service';
import { AuthService } from '../../../../core/services/auth';

@Component({
  selector: 'app-admin-users-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, ToastComponent],
  templateUrl: './list.html',
  styleUrls: ['./list.css']
})
export class AdminUsersListComponent implements OnInit {
  private cdr = inject(ChangeDetectorRef);
  private searchDebounce: ReturnType<typeof setTimeout> | null = null;

  loading = true;
  error = '';
  users: AdminUserSummary[] = [];
  filteredUsers: AdminUserSummary[] = [];
  searchTerm = '';
  filterRole = 'all';
  filterStatus = 'all';
  filterKycStatus = 'all';

  isSuperAdmin = false;
  showCreateAdmin = false;
  creatingAdmin = false;
  createError = '';
  showToast = false;
  toastMessage = '';
  toastType: 'success' | 'error' | 'warning' | 'info' = 'info';
  newAdmin: CreateAdminRequest = {
    fullName: '',
    phone: '',
    email: '',
    pin: ''
  };

  constructor(
    private router: Router,
    private adminService: AdminService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.resolveSuperAdminAccess();
    this.loadUsers();
  }

  private resolveSuperAdminAccess() {
    this.isSuperAdmin = this.authService.isSuperAdmin();
    if (this.isSuperAdmin) {
      return;
    }
    this.authService.refreshToken().subscribe({
      next: () => {
        this.isSuperAdmin = this.authService.isSuperAdmin();
        this.cdr.markForCheck();
      },
      error: () => {
        this.isSuperAdmin = this.authService.isSuperAdmin();
        this.cdr.markForCheck();
      }
    });
  }

  get landlordCount(): number {
    return this.users.filter(u => u.role === 'LANDLORD').length;
  }

  get tenantCount(): number {
    return this.users.filter(u => u.role === 'TENANT').length;
  }

  get hasActiveFilters(): boolean {
    return !!this.searchTerm.trim()
      || this.filterRole !== 'all'
      || this.filterStatus !== 'all'
      || this.filterKycStatus !== 'all';
  }

  loadUsers() {
    this.loading = true;
    this.error = '';

    const params: { role?: string; status?: string; search?: string; kycStatus?: string } = {};
    if (this.filterRole !== 'all') params.role = this.filterRole;
    if (this.filterStatus !== 'all') params.status = this.filterStatus;
    if (this.filterKycStatus !== 'all') params.kycStatus = this.filterKycStatus;
    if (this.searchTerm.trim()) params.search = this.searchTerm.trim();

    this.adminService.listUsers(params).subscribe({
      next: (users) => {
        this.users = users;
        this.filteredUsers = users;
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

  onSearchChange() {
    if (this.searchDebounce) clearTimeout(this.searchDebounce);
    this.searchDebounce = setTimeout(() => this.loadUsers(), 300);
  }

  resetFilters() {
    this.searchTerm = '';
    this.filterRole = 'all';
    this.filterStatus = 'all';
    this.filterKycStatus = 'all';
    this.loadUsers();
  }

  viewUser(userId: string) {
    this.router.navigate(['/admin/users', userId]);
  }

  openCreateAdmin() {
    this.createError = '';
    this.newAdmin = { fullName: '', phone: '', email: '', pin: '' };
    this.showCreateAdmin = true;
  }

  closeCreateAdmin() {
    this.showCreateAdmin = false;
    this.createError = '';
  }

  submitCreateAdmin() {
    this.createError = '';

    if (!this.newAdmin.fullName.trim()) {
      this.createError = 'Full name is required';
      return;
    }
    if (!this.newAdmin.email.trim()) {
      this.createError = 'Email is required for admin accounts';
      return;
    }
    if (!this.newAdmin.phone.trim()) {
      this.createError = 'Phone number is required';
      return;
    }
    if (!this.newAdmin.pin || this.newAdmin.pin.length < 4) {
      this.createError = 'PIN must be at least 4 digits';
      return;
    }

    const phone = this.normalizePhone(this.newAdmin.phone);
    this.creatingAdmin = true;

    this.adminService.createAdminAccount({
      ...this.newAdmin,
      phone
    }).subscribe({
      next: () => {
        this.creatingAdmin = false;
        this.showCreateAdmin = false;
        this.toastType = 'success';
        this.toastMessage = 'Admin account created successfully';
        this.showToast = true;
        this.loadUsers();
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.creatingAdmin = false;
        this.createError = err.message || 'Failed to create admin';
        this.cdr.markForCheck();
      }
    });
  }

  private normalizePhone(phone: string): string {
    let cleaned = phone.replace(/\D/g, '');
    if (cleaned.startsWith('0')) {
      cleaned = '254' + cleaned.substring(1);
    } else if (cleaned.startsWith('7') || cleaned.startsWith('1')) {
      cleaned = '254' + cleaned;
    }
    return cleaned;
  }

  getRoleBadgeClass(role: string): string {
    switch (role) {
      case 'TENANT': return 'tenant';
      case 'LANDLORD': return 'landlord';
      case 'ADMIN':
      case 'SUPER_ADMIN': return 'admin';
      default: return 'info';
    }
  }

  getStatusBadgeClass(status: string): string {
    return status === 'active' ? 'success' : 'danger';
  }

  getSummaryLabel(user: AdminUserSummary): string {
    if (user.role === 'LANDLORD' || user.role === 'AGENT') {
      return `${user.propertyCount ?? 0} properties · ${user.tenantCount ?? 0} tenants`;
    }
    if (user.role === 'TENANT') {
      return `${user.tenancyCount ?? 0} tenancies · KYC ${user.kycStatus || '—'}`;
    }
    if (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') {
      return 'Platform administrator';
    }
    return 'Platform user';
  }

  closeToast() {
    this.showToast = false;
  }
}

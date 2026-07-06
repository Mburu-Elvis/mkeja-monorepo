import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ToastComponent } from '../../../../shared/components/toast/toast';
import { UserProfilePanelsComponent } from '../../../../shared/components/user-profile-panels/user-profile-panels';
import { AdminService, AdminUserDetail } from '../../../../core/services/admin.service';

@Component({
  selector: 'app-admin-users-details',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, ToastComponent, UserProfilePanelsComponent],
  templateUrl: './details.html',
  styleUrls: ['./details.css']
})
export class AdminUsersDetailsComponent implements OnInit {
  loading = true;
  userId = '';
  user: AdminUserDetail | null = null;
  editing = false;
  editData: { fullName: string; email: string } = { fullName: '', email: '' };
  showToast = false;
  toastMessage = '';
  toastType: 'success' | 'error' | 'warning' | 'info' = 'info';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private adminService: AdminService
  ) {}

  ngOnInit() {
    this.userId = this.route.snapshot.params['id'];
    this.loadUser();
  }

  loadUser() {
    this.loading = true;
    this.adminService.getUser(this.userId).subscribe({
      next: (user) => {
        this.user = user;
        this.loading = false;
      },
      error: (err) => {
        this.toastType = 'error';
        this.toastMessage = err.message;
        this.showToast = true;
        this.loading = false;
      }
    });
  }

  onBack() {
    this.router.navigate(['/admin/users']);
  }

  startEdit() {
    if (!this.user) return;
    this.editing = true;
    this.editData = {
      fullName: this.user.fullName,
      email: this.user.email || ''
    };
  }

  cancelEdit() {
    this.editing = false;
  }

  saveUser() {
    if (!this.user) return;
    this.loading = true;
    this.adminService.updateUser(this.userId, this.editData).subscribe({
      next: (user) => {
        this.user = user;
        this.editing = false;
        this.loading = false;
        this.toastType = 'success';
        this.toastMessage = 'User updated successfully';
        this.showToast = true;
      },
      error: (err) => {
        this.loading = false;
        this.toastType = 'error';
        this.toastMessage = err.message;
        this.showToast = true;
      }
    });
  }

  toggleStatus() {
    if (!this.user) return;
    this.loading = true;
    this.adminService.toggleUserStatus(this.userId).subscribe({
      next: (user) => {
        this.user = user;
        this.loading = false;
        this.toastType = 'success';
        this.toastMessage = `User ${user.status === 'active' ? 'activated' : 'suspended'}`;
        this.showToast = true;
      },
      error: (err) => {
        this.loading = false;
        this.toastType = 'error';
        this.toastMessage = err.message;
        this.showToast = true;
      }
    });
  }

  closeToast() {
    this.showToast = false;
  }

  manageTenancy(tenancyId: number) {
    this.router.navigate(['/admin/tenancies'], { queryParams: { search: tenancyId } });
  }
}

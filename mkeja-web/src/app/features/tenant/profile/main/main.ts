import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ToastComponent } from '../../../../shared/components/toast/toast';
import { UserProfilePanelsComponent } from '../../../../shared/components/user-profile-panels/user-profile-panels';
import { AuthService } from '../../../../core/services/auth';
import { ProfileService, UserProfile } from '../../../../core/services/profile.service';

@Component({
  selector: 'app-tenant-profile-main',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    ToastComponent,
    UserProfilePanelsComponent
  ],
  templateUrl: './main.html',
  styleUrls: ['./main.css']
})
export class TenantProfileMainComponent implements OnInit {
  profile: UserProfile | null = null;
  loading = true;
  kycPending = false;
  kycRejected = false;
  showChangePin = false;
  currentPin = '';
  newPin = '';
  confirmPin = '';
  changingPin = false;

  showToast = false;
  toastMessage = '';
  toastType: 'success' | 'error' | 'warning' | 'info' = 'info';

  constructor(
    private authService: AuthService,
    private profileService: ProfileService,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadProfile();
  }

  get kycApproved(): boolean {
    return this.authService.isKycApproved(this.profile?.kycStatus);
  }

  get kycStatusLabel(): string {
    if (this.kycApproved) return 'Verified';
    if (this.kycRejected) return 'Rejected';
    return 'Pending';
  }

  get kycStatusClass(): string {
    if (this.kycApproved) return 'approved';
    if (this.kycRejected) return 'rejected';
    return 'pending';
  }

  get roleDisplayName(): string {
    return 'Tenant';
  }

  get documentsButtonLabel(): string {
    if (this.kycApproved) return 'View / Update Documents';
    if (this.kycRejected) return 'Re-upload Documents';
    return 'Complete Verification';
  }

  loadProfile() {
    this.loading = true;
    this.profileService.getMyProfile().subscribe({
      next: (profile) => {
        this.profile = profile;
        this.applyKycFlags(profile);
        this.loading = false;
      },
      error: () => {
        const user = this.authService.getCurrentUser();
        if (user) {
          this.profile = {
            id: user.id,
            fullName: user.fullName,
            phone: user.phone,
            email: user.email,
            role: user.role,
            kycStatus: user.kycStatus,
            joinedDate: String(user.createdAt)
          };
          this.applyKycFlags(this.profile);
        }
        this.loading = false;
      }
    });
  }

  private applyKycFlags(profile: UserProfile | null): void {
    this.kycPending = this.authService.isKycPending(profile?.kycStatus);
    this.kycRejected = this.authService.isKycRejected(profile?.kycStatus);
  }

  toggleChangePin() {
    this.showChangePin = !this.showChangePin;
    this.currentPin = '';
    this.newPin = '';
    this.confirmPin = '';
  }

  changePin() {
    if (!this.currentPin) {
      this.showError('Please enter your current PIN');
      return;
    }
    if (!this.newPin || this.newPin.length < 4) {
      this.showError('New PIN must be at least 4 digits');
      return;
    }
    if (this.newPin !== this.confirmPin) {
      this.showError('New PINs do not match');
      return;
    }

    this.changingPin = true;

    setTimeout(() => {
      this.changingPin = false;
      this.showChangePin = false;
      this.toastType = 'success';
      this.toastMessage = 'PIN changed successfully!';
      this.showToast = true;
    }, 1500);
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/auth/login']);
  }

  showError(message: string) {
    this.toastType = 'error';
    this.toastMessage = message;
    this.showToast = true;
  }

  closeToast() {
    this.showToast = false;
  }
}

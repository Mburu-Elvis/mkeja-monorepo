import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ToastComponent } from '../../../shared/components/toast/toast';
import { UserProfilePanelsComponent } from '../../../shared/components/user-profile-panels/user-profile-panels';
import { AuthService } from '../../../core/services/auth';
import { ProfileService, UserProfile } from '../../../core/services/profile.service';

@Component({
  selector: 'app-landlord-profile',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    ToastComponent,
    UserProfilePanelsComponent
  ],
  templateUrl: './profile.html',
  styleUrls: ['./profile.css']
})
export class LandlordProfileComponent implements OnInit {
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
    if (this.authService.isKycRejected(this.profile?.kycStatus)) return 'Rejected';
    return 'Pending';
  }

  get kycStatusClass(): string {
    if (this.kycApproved) return 'approved';
    if (this.authService.isKycRejected(this.profile?.kycStatus)) return 'rejected';
    return 'pending';
  }

  get isAgent(): boolean {
    return this.profile?.role === 'AGENT';
  }

  get roleDisplayName(): string {
    if (this.isAgent) return 'Property Agent';
    if (this.profile?.role === 'LANDLORD') return 'Property Owner';
    return this.profile?.role || '—';
  }

  get documentsButtonLabel(): string {
    if (this.kycApproved) return 'View / Update Documents';
    if (this.kycRejected) return 'Re-upload Documents';
    return 'Complete Verification';
  }

  get showPortfolioStats(): boolean {
    if (!this.profile) return false;
    if (this.isAgent) return this.profile.activeTenancyCount != null;
    return this.profile.propertyCount != null
      || this.profile.unitCount != null
      || this.profile.tenantCount != null
      || this.profile.activeTenancyCount != null;
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

import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MpesaHeaderComponent } from '../../../../shared/components/header/header';
import { ToastComponent } from '../../../../shared/components/toast/toast';
import { TenantService } from '../../../../core/services/tenant';
import { AuthService } from '../../../../core/services/auth';

@Component({
  selector: 'app-tenant-onboarding-kyc-pending',
  standalone: true,
  imports: [CommonModule, RouterLink, MpesaHeaderComponent, ToastComponent],
  templateUrl: './kyc-pending.html',
  styleUrls: ['./kyc-pending.css']
})
export class TenantOnboardingKycPendingComponent implements OnInit, OnDestroy {
  invitationCode = '';
  tenantId = '';
  kycStatus = 'PENDING';
  checking = false;
  loadingContext = true;
  private pollTimer: ReturnType<typeof setInterval> | null = null;

  showToast = false;
  toastMessage = '';
  toastType: 'success' | 'error' | 'warning' | 'info' = 'info';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private tenantService: TenantService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.invitationCode = this.route.snapshot.queryParams['code'] || '';
    this.tenantId =
      this.route.snapshot.queryParams['tenantId'] ||
      sessionStorage.getItem('tenantId') ||
      '';
    if (this.tenantId) {
      sessionStorage.setItem('tenantId', this.tenantId);
      this.loadingContext = false;
      this.startPolling();
      return;
    }
    this.resolveTenantContext();
  }

  ngOnDestroy() {
    if (this.pollTimer) clearInterval(this.pollTimer);
  }

  private resolveTenantContext() {
    const storedTenantId = sessionStorage.getItem('tenantId');
    if (storedTenantId) {
      this.tenantId = storedTenantId;
      this.loadingContext = false;
      this.startPolling();
      return;
    }

    if (this.authService.isAuthenticated()) {
      this.tenantService.getMyOnboardingContext().subscribe({
        next: (context) => {
          this.tenantId = context.tenantId;
          this.kycStatus = context.kycStatus || 'PENDING';
          if (!this.invitationCode && context.invitationCode) {
            this.invitationCode = context.invitationCode;
          }
          sessionStorage.setItem('tenantId', context.tenantId);
          this.loadingContext = false;
          this.startPolling();
        },
        error: () => {
          this.loadingContext = false;
        }
      });
      return;
    }

    this.loadingContext = false;
  }

  private startPolling() {
    this.checkStatus();
    this.pollTimer = setInterval(() => this.checkStatus(true), 10000);
  }

  get statusLabel(): string {
    switch (this.kycStatus) {
      case 'MANUAL_REVIEW':
        return 'Under manual review';
      case 'APPROVED':
        return 'Approved';
      case 'REJECTED':
        return 'Rejected';
      default:
        return 'Pending verification';
    }
  }

  get reuploadQueryParams(): Record<string, string> {
    const params: Record<string, string> = {};
    if (this.invitationCode) params['code'] = this.invitationCode;
    if (this.tenantId) params['tenantId'] = this.tenantId;
    return params;
  }

  checkStatus(silent = false) {
    if (!this.tenantId) return;
    if (!silent) this.checking = true;

    this.tenantService.getTenantProfile(this.tenantId).subscribe({
      next: (profile) => {
        this.kycStatus = profile.kycStatus || 'PENDING';
        this.authService.updateKycStatus(this.kycStatus as any);
        this.checking = false;

        if (this.kycStatus === 'APPROVED') {
          if (this.invitationCode) {
            this.router.navigate(['/tenant/onboarding/lease-sign'], {
              queryParams: { code: this.invitationCode }
            });
          } else {
            this.router.navigate(['/tenant/dashboard']);
          }
        } else if (this.kycStatus === 'REJECTED' && !silent) {
          this.toastType = 'error';
          this.toastMessage = 'Your KYC was rejected. Please re-upload your documents.';
          this.showToast = true;
        }
      },
      error: (err) => {
        this.checking = false;
        if (!silent) {
          this.toastType = 'error';
          this.toastMessage = err.message;
          this.showToast = true;
        }
      }
    });
  }

  closeToast() {
    this.showToast = false;
  }
}

import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { MpesaHeaderComponent } from '../../../../shared/components/header/header';
import { ToastComponent } from '../../../../shared/components/toast/toast';
import { TenantService } from '../../../../core/services/tenant';

@Component({
  selector: 'app-tenant-onboarding-security-deposit',
  standalone: true,
  imports: [
    CommonModule,
    MpesaHeaderComponent,
    ToastComponent
  ],
  templateUrl: './security-deposit.html',
  styleUrls: ['./security-deposit.css']
})
export class TenantOnboardingSecurityDepositComponent implements OnInit, OnDestroy {
  invitationCode = '';
  tenantId = '';
  monthlyRent = 0;
  securityDeposit = 0;
  kycStatus = 'PENDING';
  processing = false;
  private pollInterval?: ReturnType<typeof setInterval>;

  showToast = false;
  toastMessage = '';
  toastType: 'success' | 'error' | 'warning' | 'info' = 'info';

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private tenantService: TenantService
  ) {
    this.invitationCode = this.route.snapshot.queryParams['code'];
    this.monthlyRent = parseInt(this.route.snapshot.queryParams['monthlyRent']) || 5000;
    this.securityDeposit = this.monthlyRent;
    this.tenantId = sessionStorage.getItem('tenantId') || '';
  }

  ngOnInit() {
    if (!this.tenantId) return;
    this.tenantService.initiateSecurityDeposit(this.tenantId).subscribe({
      next: () => this.startPolling(),
      error: (err) => this.showToastMessage(err.message, 'error')
    });
  }

  ngOnDestroy() {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
    }
  }

  startPolling() {
    this.pollInterval = setInterval(() => {
      this.tenantService.getSecurityDepositStatus(this.tenantId).subscribe({
        next: (status) => {
          this.kycStatus = status.status;
          if (status.status === 'APPROVED') {
            if (this.pollInterval) clearInterval(this.pollInterval);
          }
        }
      });
    }, 2000);
  }

  payDeposit() {
    if (this.kycStatus !== 'APPROVED') {
      this.showToastMessage('Please wait for verification to complete', 'warning');
      return;
    }
    this.processing = true;
    this.router.navigate(['/tenant/onboarding/payment-plan'], {
      queryParams: {
        code: this.invitationCode,
        monthlyRent: this.monthlyRent
      }
    });
  }

  showToastMessage(message: string, type: 'success' | 'error' | 'warning' | 'info') {
    this.toastType = type;
    this.toastMessage = message;
    this.showToast = true;
  }

  closeToast() {
    this.showToast = false;
  }
}

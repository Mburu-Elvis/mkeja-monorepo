import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { MpesaHeaderComponent } from '../../../../shared/components/header/header';
import { ToastComponent } from '../../../../shared/components/toast/toast';
import { TenantService } from '../../../../core/services/tenant';

@Component({
  selector: 'app-tenant-onboarding-ratiba-consent',
  standalone: true,
  imports: [
    CommonModule,
    MpesaHeaderComponent,
    ToastComponent
  ],
  templateUrl: './ratiba-consent.html',
  styleUrls: ['./ratiba-consent.css']
})
export class TenantOnboardingRatibaConsentComponent {
  invitationCode = '';
  tenantId = '';
  plan: 'DAILY' | 'WEEKLY' | 'MONTHLY' = 'DAILY';
  monthlyRent = 5000;
  dailyAmount = 0;
  weeklyAmount = 0;
  processing = false;

  showToast = false;
  toastMessage = '';
  toastType: 'success' | 'error' | 'warning' | 'info' = 'info';

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private tenantService: TenantService
  ) {
    this.invitationCode = this.route.snapshot.queryParams['code'];
    this.plan = (this.route.snapshot.queryParams['plan'] || 'DAILY') as 'DAILY' | 'WEEKLY' | 'MONTHLY';
    this.monthlyRent = parseInt(this.route.snapshot.queryParams['monthlyRent']) || 5000;
    this.tenantId = sessionStorage.getItem('tenantId') || '';
    this.dailyAmount = Math.ceil(this.monthlyRent / 30);
    this.weeklyAmount = Math.ceil(this.monthlyRent / 4);
  }

  getAmount(): number {
    return this.plan === 'DAILY' ? this.dailyAmount : this.weeklyAmount;
  }

  getScheduleText(): string {
    if (this.plan === 'DAILY') {
      return 'every morning at 6:00 AM';
    } else if (this.plan === 'WEEKLY') {
      return 'every Monday at 7:00 AM';
    }
    return 'on the due date';
  }

  approve() {
    if (!this.tenantId) return;
    this.processing = true;

    this.tenantService.setupRatiba(this.tenantId, this.plan, this.getAmount()).subscribe({
      next: () => {
        this.processing = false;
        this.toastType = 'success';
        this.toastMessage = 'Auto-payments set up successfully!';
        this.showToast = true;

        setTimeout(() => {
          sessionStorage.removeItem('tenantId');
          this.router.navigate(['/auth/login'], {
            queryParams: { registered: 'tenant' }
          });
        }, 2000);
      },
      error: (err) => {
        this.processing = false;
        this.toastType = 'error';
        this.toastMessage = err.message;
        this.showToast = true;
      }
    });
  }

  closeToast() {
    this.showToast = false;
  }

  onBack() {
    this.router.navigate(['/tenant/onboarding/payment-plan'], {
      queryParams: {
        code: this.invitationCode,
        plan: this.plan,
        monthlyRent: this.monthlyRent
      }
    });
  }
}

import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { MpesaHeaderComponent } from '../../../../shared/components/header/header';
import { TenantService } from '../../../../core/services/tenant';

@Component({
  selector: 'app-tenant-onboarding-payment-plan',
  standalone: true,
  imports: [
    CommonModule,
    MpesaHeaderComponent
  ],
  templateUrl: './payment-plan.html',
  styleUrls: ['./payment-plan.css']
})
export class TenantOnboardingPaymentPlanComponent {
  invitationCode = '';
  tenantId = '';
  monthlyRent = 5000;
  selectedPlan: 'DAILY' | 'WEEKLY' | 'MONTHLY' = 'DAILY';
  saving = false;

  dailyAmount = Math.ceil(this.monthlyRent / 30);
  weeklyAmount = Math.ceil(this.monthlyRent / 4);

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private tenantService: TenantService
  ) {
    this.invitationCode = this.route.snapshot.queryParams['code'];
    this.monthlyRent = parseInt(this.route.snapshot.queryParams['monthlyRent']) || 5000;
    this.tenantId = sessionStorage.getItem('tenantId') || '';
    this.dailyAmount = Math.ceil(this.monthlyRent / 30);
    this.weeklyAmount = Math.ceil(this.monthlyRent / 4);
  }

  selectPlan(plan: 'DAILY' | 'WEEKLY' | 'MONTHLY') {
    this.selectedPlan = plan;
  }

  continue() {
    if (!this.tenantId) return;
    this.saving = true;
    this.tenantService.setPaymentPlan(this.tenantId, this.selectedPlan).subscribe({
      next: () => {
        this.saving = false;
        this.router.navigate(['/tenant/onboarding/ratiba-consent'], {
          queryParams: {
            code: this.invitationCode,
            plan: this.selectedPlan,
            monthlyRent: this.monthlyRent
          }
        });
      },
      error: () => {
        this.saving = false;
      }
    });
  }
}

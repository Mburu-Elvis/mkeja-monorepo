import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { MpesaHeaderComponent } from '../../../../shared/components/header/header';
import { ToastComponent } from '../../../../shared/components/toast/toast';
import { TenantService } from '../../../../core/services/tenant';

@Component({
  selector: 'app-tenant-onboarding-verify-identity',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MpesaHeaderComponent,
    ToastComponent
  ],
  templateUrl: './verify-identity.html',
  styleUrls: ['./verify-identity.css']
})
export class TenantOnboardingVerifyIdentityComponent {
  invitationCode = '';
  formData = {
    fullName: '',
    phone: '',
    idNumber: '',
    idType: 'NATIONAL_ID'
  };

  loading = false;
  showToast = false;
  toastMessage = '';
  toastType: 'success' | 'error' | 'warning' | 'info' = 'error';

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private tenantService: TenantService
  ) {
    this.invitationCode = this.route.snapshot.queryParams['code'];
  }

  formatPhone() {
    let cleaned = this.formData.phone.replace(/\D/g, '');
    if (cleaned.startsWith('0')) {
      cleaned = '254' + cleaned.substring(1);
    } else if (cleaned.startsWith('7')) {
      cleaned = '254' + cleaned;
    }
    if (cleaned.length > 12) {
      cleaned = cleaned.substring(0, 12);
    }
    this.formData.phone = cleaned;
  }

  onSubmit() {
    if (!this.formData.fullName) {
      this.showError('Please enter your full name');
      return;
    }
    if (!this.formData.phone || this.formData.phone.length !== 12) {
      this.showError('Enter a valid M-Pesa number (2547XXXXXXXX)');
      return;
    }
    if (!this.formData.idNumber) {
      this.showError('Please enter your ID number');
      return;
    }

    this.loading = true;

    this.tenantService.registerTenant({
      invitationCode: this.invitationCode,
      fullName: this.formData.fullName,
      phone: this.formData.phone,
      idNumber: this.formData.idNumber,
      idType: this.formData.idType
    }).subscribe({
      next: (response) => {
        sessionStorage.setItem('tenantId', response.tenantId);
        sessionStorage.setItem('walletId', response.walletId);
        this.loading = false;
        this.router.navigate(['/tenant/onboarding/kyc-docs'], {
          queryParams: {
            code: this.invitationCode,
            tenantId: response.tenantId
          }
        });
      },
      error: (err) => {
        this.loading = false;
        this.showError(err.message);
      }
    });
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

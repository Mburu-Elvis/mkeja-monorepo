import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { MpesaHeaderComponent } from '../../../shared/components/header/header';
import { ToastComponent } from '../../../shared/components/toast/toast';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    MpesaHeaderComponent,
    ToastComponent
  ],
  templateUrl: './forgot-password.html',
  styleUrls: ['./forgot-password.css']
})
export class ForgotPasswordComponent {
onBack() {
throw new Error('Method not implemented.');
}
  phone = '';
  loading = false;
  showToast = false;
  toastMessage = '';
  toastType: 'success' | 'error' | 'warning' | 'info' = 'error';

  constructor(private router: Router) {}

  formatPhone() {
    let cleaned = this.phone.replace(/\D/g, '');
    if (cleaned.startsWith('0')) {
      cleaned = '254' + cleaned.substring(1);
    } else if (cleaned.startsWith('7')) {
      cleaned = '254' + cleaned;
    }
    if (cleaned.length > 12) {
      cleaned = cleaned.substring(0, 12);
    }
    this.phone = cleaned;
  }

  onSubmit() {
    if (!this.phone || this.phone.length !== 12) {
      this.showError('Enter a valid M-Pesa number (2547XXXXXXXX)');
      return;
    }

    this.loading = true;
    
    setTimeout(() => {
      this.loading = false;
      this.router.navigate(['/auth/verify-otp'], { 
        queryParams: { phone: this.phone, purpose: 'reset-pin' }
      });
    }, 1500);
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
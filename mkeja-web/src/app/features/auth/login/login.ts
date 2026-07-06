// auth/login/login.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './login.html',
  styleUrls: ['./login.css']
})
export class LoginComponent implements OnInit {
  displayPhone: string = '';
  pin: string = '';
  showPin: boolean = false;
  loading: boolean = false;
  error: string = '';
  successMessage: string = '';

  constructor(
    private authService: AuthService,
    private router: Router
  ) { }

  ngOnInit(): void {
    if (this.router.url.includes('registered=landlord')) {
      this.successMessage = 'Registration submitted. Sign in with your phone and PIN while KYC is reviewed.';
    }
    if (this.router.url.includes('registered=agent')) {
      this.successMessage = 'Agent application submitted. Sign in after KYC approval to access your assigned properties.';
    }
    if (this.router.url.includes('registered=tenant')) {
      this.successMessage = 'Onboarding complete. Sign in with your phone and PIN to access your tenant dashboard.';
    }
  }

  get fullPhoneNumber(): string {
    if (!this.displayPhone) return '';
    return '+254' + this.displayPhone;
  }

  getCompletePhoneNumber(): string {
    if (!this.displayPhone) return '';
    return '254' + this.displayPhone;
  }

  onPhoneInput(): void {
    let cleaned = this.displayPhone.replace(/\D/g, '');
    if (cleaned.startsWith('254')) {
      cleaned = cleaned.substring(3);
    } else if (cleaned.startsWith('0')) {
      cleaned = cleaned.substring(1);
    }
    if (cleaned.length > 9) {
      cleaned = cleaned.substring(0, 9);
    }
    this.displayPhone = cleaned;
    if (this.error) {
      this.error = '';
    }
  }

  validatePhone(): boolean {
    const fullNumber = this.getCompletePhoneNumber();

    if (
      !fullNumber ||
      fullNumber.length !== 12 ||
      (!fullNumber.startsWith('2547') && !fullNumber.startsWith('2541'))
    ) {
      this.error = 'Enter a valid M-Pesa number (2547XXXXXXXX) or (2541XXXXXXXX)';
      return false;
    }

    return true;
  }

  validatePin(): boolean {
    if (!this.pin || this.pin.length < 4) {
      this.error = 'Enter a valid PIN (minimum 4 digits)';
      return false;
    }
    return true;
  }

  onSubmit(): void {
    this.error = '';
    const fullPhone = this.getCompletePhoneNumber();

    if (
      !fullPhone ||
      fullPhone.length !== 12 ||
      (!fullPhone.startsWith('2547') && !fullPhone.startsWith('2541'))
    ) {
      this.error = 'Enter a valid M-Pesa number (2547XXXXXXXX) or (2541XXXXXXXX)';
      return;
    }

    if (!this.pin || this.pin.length < 4) {
      this.error = 'Enter a valid PIN (minimum 4 digits)';
      return;
    }

    this.loading = true;

    this.authService.login(fullPhone, this.pin).subscribe({
      next: (response) => {
        this.loading = false;
        if (response.otpRequired) {
          this.router.navigate(['/auth/verify-otp'], {
            queryParams: {
              phone: fullPhone,
              challengeId: response.challengeId,
              purpose: 'first-login'
            }
          });
          return;
        }
        const role = this.authService.getDashboardRole(response.user?.role);
        this.router.navigate([`/${role}/dashboard`]);
      },
      error: (err) => {
        this.loading = false;
        this.error = err.message || 'Invalid phone number or PIN';
      }
    });
  }
}
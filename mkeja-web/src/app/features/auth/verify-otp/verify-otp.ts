import { Component, OnInit, OnDestroy, ViewChildren, QueryList, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../../core/services/auth';

@Component({
  selector: 'app-verify-otp',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './verify-otp.html',
  styleUrls: ['./verify-otp.css']
})
export class VerifyOtpComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChildren('otpInput') otpInputs!: QueryList<ElementRef<HTMLInputElement>>;

  phone = '';
  challengeId = '';
  purpose = 'first-login';
  otp = ['', '', '', '', '', ''];
  loading = false;
  error = '';
  timer = 60;
  canResend = false;
  private interval: ReturnType<typeof setInterval> | null = null;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.phone = this.route.snapshot.queryParams['phone'] || '';
    this.challengeId = this.route.snapshot.queryParams['challengeId'] || '';
    this.purpose = this.route.snapshot.queryParams['purpose'] || 'first-login';

    if (!this.phone || !this.challengeId) {
      this.error = 'Verification session expired. Please sign in again.';
    }

    this.startTimer();
  }

  ngAfterViewInit() {
    setTimeout(() => this.focusInput(0), 0);
  }

  ngOnDestroy() {
    if (this.interval) {
      clearInterval(this.interval);
    }
  }

  get maskedPhone(): string {
    const digits = this.phone.replace(/\D/g, '');
    if (digits.length < 7) {
      return this.phone || 'your phone';
    }
    return `+${digits.slice(0, 3)} *** *** ${digits.slice(-3)}`;
  }

  get hasCompleteOtp(): boolean {
    return this.getOtpString().length === 6;
  }

  startTimer() {
    if (this.interval) {
      clearInterval(this.interval);
    }
    this.timer = 60;
    this.canResend = false;
    this.interval = setInterval(() => {
      if (this.timer > 0) {
        this.timer--;
      } else {
        this.canResend = true;
        if (this.interval) {
          clearInterval(this.interval);
          this.interval = null;
        }
      }
    }, 1000);
  }

  onOtpInput(index: number, event: Event) {
    const input = event.target as HTMLInputElement;
    const value = input.value.replace(/\D/g, '');

    if (!value) {
      this.otp[index] = '';
      return;
    }

    this.otp[index] = value.slice(-1);
    input.value = this.otp[index];
    this.error = '';

    if (index < 5) {
      this.focusInput(index + 1);
    } else if (this.hasCompleteOtp) {
      this.onSubmit();
    }
  }

  onOtpKeydown(index: number, event: KeyboardEvent) {
    if (event.key === 'Backspace' && !this.otp[index] && index > 0) {
      this.focusInput(index - 1);
    }
  }

  onPaste(event: ClipboardEvent) {
    event.preventDefault();
    const pasted = event.clipboardData?.getData('text')?.replace(/\D/g, '') ?? '';
    if (pasted.length !== 6) {
      return;
    }
    this.otp = pasted.split('');
    this.error = '';
    this.focusInput(5);
  }

  private focusInput(index: number) {
    const inputs = this.otpInputs?.toArray() ?? [];
    const el = inputs[index]?.nativeElement;
    if (el) {
      el.focus();
      el.select();
    }
  }

  getOtpString(): string {
    return this.otp.join('');
  }

  onSubmit() {
    const otpString = this.getOtpString();
    if (otpString.length !== 6) {
      this.error = 'Enter the full 6-digit code.';
      return;
    }
    if (!this.challengeId || !this.phone) {
      this.error = 'Verification session expired. Please sign in again.';
      return;
    }

    this.loading = true;
    this.error = '';

    this.authService.verifyOtp(this.challengeId, this.phone, otpString).subscribe({
      next: (response) => {
        this.loading = false;
        const role = this.authService.getDashboardRole(response.user?.role);
        this.router.navigate([`/${role}/dashboard`]);
      },
      error: (err) => {
        this.loading = false;
        this.error = this.mapErrorMessage(err.message);
      }
    });
  }

  resendCode() {
    if (!this.canResend || !this.challengeId || !this.phone || this.loading) {
      return;
    }

    this.loading = true;
    this.error = '';

    this.authService.resendOtp(this.challengeId, this.phone).subscribe({
      next: (response) => {
        this.loading = false;
        this.challengeId = response.challengeId || this.challengeId;
        this.otp = ['', '', '', '', '', ''];
        this.startTimer();
        this.focusInput(0);
      },
      error: (err) => {
        this.loading = false;
        this.error = this.mapErrorMessage(err.message);
      }
    });
  }

  onBack() {
    this.router.navigate(['/auth/login']);
  }

  private mapErrorMessage(message?: string): string {
    if (!message) {
      return 'Unable to verify the code. Try again.';
    }
    if (message.includes('0 Unknown Error') || message.includes('Http failure response')) {
      return 'Cannot reach the server. Check your connection and try again.';
    }
    return message;
  }
}

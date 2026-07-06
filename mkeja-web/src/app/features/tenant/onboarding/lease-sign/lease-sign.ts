import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MpesaHeaderComponent } from '../../../../shared/components/header/header';
import { LoadingSpinnerComponent } from '../../../../shared/components/loading-spinner/loading-spinner';
import { ToastComponent } from '../../../../shared/components/toast/toast';
import { TenantService } from '../../../../core/services/tenant';
import { AuthService } from '../../../../core/services/auth';
import { LeaseSummary } from '../../../../models/onboarding.model';

@Component({
  selector: 'app-tenant-onboarding-lease-sign',
  standalone: true,
  imports: [CommonModule, MpesaHeaderComponent, LoadingSpinnerComponent, ToastComponent],
  templateUrl: './lease-sign.html',
  styleUrls: ['./lease-sign.css']
})
export class TenantOnboardingLeaseSignComponent implements OnInit {
  loading = true;
  signing = false;
  invitationCode = '';
  tenantId = '';
  lease: LeaseSummary | null = null;
  errorMessage = '';
  showToast = false;
  toastMessage = '';
  toastType: 'success' | 'error' = 'error';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private tenantService: TenantService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.invitationCode = this.route.snapshot.queryParams['code'] || sessionStorage.getItem('invitationCode') || '';
    this.tenantId = sessionStorage.getItem('tenantId') || '';
    if (!this.tenantId && this.authService.isAuthenticated()) {
      this.tenantService.getMyOnboardingContext().subscribe({
        next: (ctx) => {
          this.tenantId = ctx.tenantId;
          sessionStorage.setItem('tenantId', ctx.tenantId);
          this.loadLease();
        },
        error: () => this.loadLease()
      });
      return;
    }
    this.loadLease();
  }

  loadLease(): void {
    if (!this.tenantId || !this.invitationCode) {
      this.errorMessage = 'Missing session. Restart from your invitation link.';
      this.loading = false;
      return;
    }

    this.tenantService.getLeaseSummary(this.tenantId, this.invitationCode).subscribe({
      next: (lease) => {
        this.lease = lease;
        this.loading = false;
      },
      error: (err) => {
        this.errorMessage = err.message;
        this.loading = false;
      }
    });
  }

  signLease(): void {
    if (!this.tenantId || !this.invitationCode) return;
    this.signing = true;

    this.tenantService.signLease(this.tenantId, this.invitationCode).subscribe({
      next: () => {
        this.signing = false;
        this.router.navigate(['/tenant/onboarding/security-deposit'], {
          queryParams: { code: this.invitationCode }
        });
      },
      error: (err) => {
        this.signing = false;
        this.toastType = 'error';
        this.toastMessage = err.message;
        this.showToast = true;
      }
    });
  }

  closeToast(): void {
    this.showToast = false;
  }
}

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MpesaHeaderComponent } from '../../../../shared/components/header/header';
import { LoadingSpinnerComponent } from '../../../../shared/components/loading-spinner/loading-spinner';
import { InvitationService } from '../../../../core/services/invitation.service';
import { TenantService } from '../../../../core/services/tenant';
import { AuthService } from '../../../../core/services/auth';
import { InvitationDetails } from '../../../../models/onboarding.model';

@Component({
  selector: 'app-tenant-onboarding-invitation',
  standalone: true,
  imports: [
    CommonModule,
    MpesaHeaderComponent,
    LoadingSpinnerComponent
  ],
  templateUrl: './invitation.html',
  styleUrls: ['./invitation.css']
})
export class TenantOnboardingInvitationComponent implements OnInit {
  loading = true;
  accepting = false;
  invitationCode = '';
  invitationData: InvitationDetails | null = null;
  errorMessage = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private invitationService: InvitationService,
    private tenantService: TenantService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.invitationCode = this.route.snapshot.params['code'];
    this.loadInvitation();
  }

  loadInvitation() {
    this.loading = true;
    this.invitationService.getInvitation(this.invitationCode).subscribe({
      next: (data) => {
        this.invitationData = data;
        this.loading = false;
      },
      error: (err) => {
        this.errorMessage = err.message;
        this.loading = false;
      }
    });
  }

  acceptInvitation() {
    sessionStorage.setItem('invitationCode', this.invitationCode);
    if (this.invitationData?.monthlyRent) {
      sessionStorage.setItem('monthlyRent', String(this.invitationData.monthlyRent));
    }

    if (this.authService.isAuthenticated() && this.authService.getCurrentUser()?.role === 'TENANT') {
      this.accepting = true;
      this.errorMessage = '';
      this.invitationService.acceptInvitation(this.invitationCode).subscribe({
        next: () => this.routeExistingTenant(),
        error: (err) => {
          this.errorMessage = err.message || 'Unable to accept invitation';
          this.accepting = false;
        }
      });
      return;
    }

    this.router.navigate(['/tenant/onboarding/verify-identity'], {
      queryParams: { code: this.invitationCode }
    });
  }

  private routeExistingTenant(): void {
    this.tenantService.getMyOnboardingContext().subscribe({
      next: (ctx) => {
        sessionStorage.setItem('tenantId', ctx.tenantId);
        this.accepting = false;
        const kycOk = this.authService.isKycApproved(ctx.kycStatus);
        if (this.invitationData?.tenancyCreated) {
          this.router.navigate(['/tenant/tenancies']);
          return;
        }
        if (kycOk) {
          this.router.navigate(['/tenant/onboarding/lease-sign'], {
            queryParams: { code: this.invitationCode }
          });
          return;
        }
        this.router.navigate(['/tenant/onboarding/upload-documents'], {
          queryParams: { code: this.invitationCode, tenantId: ctx.tenantId }
        });
      },
      error: (err) => {
        this.errorMessage = err.message || 'Unable to load tenant profile';
        this.accepting = false;
      }
    });
  }
}

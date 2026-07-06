import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastComponent } from '../../../../shared/components/toast/toast';
import { KycDocumentGalleryComponent } from '../../../../shared/components/kyc-document-gallery/kyc-document-gallery';
import { KycDocumentItem } from '../../../../shared/components/kyc-document-gallery/kyc-document-item';
import { AdminService, KycApplication } from '../../../../core/services/admin.service';

@Component({
  selector: 'app-admin-kyc-queue-review',
  standalone: true,
  imports: [CommonModule, ToastComponent, KycDocumentGalleryComponent],
  templateUrl: './review.html',
  styleUrls: ['./review.css']
})
export class AdminKycQueueReviewComponent implements OnInit {
  applicationId = '';
  applicantType = 'TENANT';
  loading = true;
  submitting = false;
  application: KycApplication | null = null;
  documentItems: KycDocumentItem[] = [];

  showToast = false;
  toastMessage = '';
  toastType: 'success' | 'error' | 'warning' | 'info' = 'info';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private adminService: AdminService
  ) {}

  ngOnInit() {
    this.applicationId = this.route.snapshot.params['id'];
    this.applicantType = this.route.snapshot.queryParams['type'] || 'TENANT';
    this.loadApplication();
  }

  loadApplication() {
    this.loading = true;
    this.adminService.getKycApplication(this.applicationId, this.applicantType).subscribe({
      next: (app) => {
        this.application = app;
        this.documentItems = this.mapDocumentItems(app);
        this.loading = false;
      },
      error: (err) => {
        this.toastType = 'error';
        this.toastMessage = err.message;
        this.showToast = true;
        this.loading = false;
      }
    });
  }

  private mapDocumentItems(app: KycApplication): KycDocumentItem[] {
    const labels: Record<string, string> = {
      ID_FRONT: 'ID Front',
      ID_BACK: 'ID Back',
      SELFIE: 'Selfie / Liveness',
      PROOF_OF_BANK_OWNERSHIP: 'Proof of Bank Ownership',
      PROOF_OF_RESIDENCE: 'Proof of Residence',
      INCORPORATION: 'Certificate of Incorporation',
      CR12: 'CR12 Form',
      BIZ_ADDRESS: 'Proof of Business Address',
      BOARD_RESOLUTION: 'Board Resolution',
      SACCO_LICENSE: 'SASRA License',
      SACCO_BYLAWS: 'SACCO By-Laws',
      AGENT_LICENSE: 'Estate Agency License'
    };

    return Object.entries(app.documents || {}).map(([type, documentId]) => ({
      documentId,
      label: labels[type] || type,
      status: app.status?.toUpperCase()
    }));
  }

  approve() {
    this.submitAction('approve');
  }

  reject() {
    this.submitAction('reject');
  }

  flagForReview() {
    this.submitAction('flag');
  }

  private submitAction(action: 'approve' | 'reject' | 'flag') {
    if (!this.application) return;
    this.submitting = true;

    const request = action === 'approve'
      ? this.adminService.approveKyc(this.applicationId, this.applicantType)
      : action === 'reject'
        ? this.adminService.rejectKyc(this.applicationId, this.applicantType)
        : this.adminService.flagKyc(this.applicationId, this.applicantType);

    request.subscribe({
      next: () => {
        this.submitting = false;
        this.toastType = action === 'reject' ? 'error' : action === 'flag' ? 'warning' : 'success';
        this.toastMessage = action === 'approve'
          ? 'Application approved successfully!'
          : action === 'reject'
            ? 'Application rejected.'
            : 'Flagged for manual review.';
        this.showToast = true;
        setTimeout(() => this.router.navigate(['/admin/kyc-queue']), 1500);
      },
      error: (err) => {
        this.submitting = false;
        this.toastType = 'error';
        this.toastMessage = err.message;
        this.showToast = true;
      }
    });
  }

  onBack() {
    this.router.navigate(['/admin/kyc-queue']);
  }

  closeToast() {
    this.showToast = false;
  }
}

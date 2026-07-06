import { Component, OnDestroy, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { ToastComponent } from '../../../../shared/components/toast/toast';
import { KycDocumentGalleryComponent } from '../../../../shared/components/kyc-document-gallery/kyc-document-gallery';
import { TenantService } from '../../../../core/services/tenant';
import { AuthService } from '../../../../core/services/auth';
import { ProfileService, UserKycDocument } from '../../../../core/services/profile.service';
import { KycDocumentItem } from '../../../../shared/components/kyc-document-gallery/kyc-document-item';

type DocSlot = 'front' | 'back' | 'selfie';

interface ExistingDocPreview {
  documentId: string;
  label: string;
  mimeType?: string;
  url: string | null;
  loading: boolean;
  failed: boolean;
}

@Component({
  selector: 'app-tenant-onboarding-upload-documents',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    ToastComponent,
    KycDocumentGalleryComponent
  ],
  templateUrl: './upload-documents.html',
  styleUrls: ['./upload-documents.css']
})
export class TenantOnboardingUploadDocumentsComponent implements OnInit, OnDestroy {
  invitationCode = '';
  tenantId = '';
  onboardingFlow = false;
  kycStatus = '';

  idFrontFile: File | null = null;
  idBackFile: File | null = null;
  selfieFile: File | null = null;

  idFrontPreview: string | null = null;
  idBackPreview: string | null = null;
  selfiePreview: string | null = null;

  existingDocs: UserKycDocument[] = [];
  galleryItems: KycDocumentItem[] = [];
  existingPreviews: Record<DocSlot, ExistingDocPreview | null> = {
    front: null,
    back: null,
    selfie: null
  };

  private previewUrls: string[] = [];

  resolvingContext = false;
  loadingProfile = false;
  contextError = '';
  uploading = false;
  showToast = false;
  toastMessage = '';
  toastType: 'success' | 'error' | 'warning' | 'info' = 'error';

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private tenantService: TenantService,
    private authService: AuthService,
    private profileService: ProfileService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.invitationCode = this.route.snapshot.queryParams['code'] || '';
    const queryTenantId = this.route.snapshot.queryParams['tenantId'] || '';

    if (queryTenantId) {
      this.tenantId = queryTenantId;
      sessionStorage.setItem('tenantId', queryTenantId);
      this.onboardingFlow = !!this.invitationCode || true;
      this.loadExistingDocuments();
      return;
    }

    if (this.authService.isAuthenticated()) {
      this.resolveTenantContext();
      return;
    }

    this.tenantId = sessionStorage.getItem('tenantId') || '';
    this.onboardingFlow = !!this.invitationCode || !!this.tenantId;

    if (!this.tenantId) {
      this.contextError = 'Start from your invitation link or sign in to upload documents.';
    } else {
      this.loadExistingDocuments();
    }
  }

  ngOnDestroy() {
    this.revokePreviewUrls();
  }

  get hasExistingDocuments(): boolean {
    return this.existingDocs.length > 0;
  }

  get isUpdateMode(): boolean {
    return this.hasExistingDocuments;
  }

  get pageTitle(): string {
    return this.isUpdateMode ? 'Your KYC Documents' : 'Upload Your Documents';
  }

  get pageSubtitle(): string {
    if (this.isUpdateMode) {
      return 'View your uploaded documents below. Tap a card to replace any file, then submit your updates.';
    }
    return 'We need to verify your identity before you can complete onboarding.';
  }

  get submitLabel(): string {
    return this.isUpdateMode ? 'Submit Updates' : 'Submit for Verification';
  }

  get submitHint(): string {
    if (this.resolvingContext || this.loadingProfile) {
      return 'Loading your documents...';
    }
    if (!this.canResolveTenant()) {
      return 'Complete identity verification first to enable submission.';
    }
    if (this.isUpdateMode) {
      if (this.hasPendingUploads) {
        return 'Submit to send your updated document(s) for review.';
      }
      return 'Replace any document above to submit an update.';
    }
    const missing: string[] = [];
    if (!this.idFrontFile) missing.push('ID front');
    if (!this.idBackFile) missing.push('ID back');
    if (!this.selfieFile) missing.push('selfie');
    if (missing.length) {
      return `Add ${missing.join(', ')} to submit.`;
    }
    return 'All documents ready — tap submit to send for verification.';
  }

  get hasPendingUploads(): boolean {
    return !!(this.idFrontFile || this.idBackFile || this.selfieFile);
  }

  get canSubmit(): boolean {
    if (!this.canResolveTenant() || this.uploading || this.resolvingContext || this.loadingProfile) {
      return false;
    }
    if (this.isUpdateMode) {
      return this.hasPendingUploads;
    }
    return this.isFormValid();
  }

  slotLabel(slot: DocSlot): string {
    switch (slot) {
      case 'front': return 'ID Front';
      case 'back': return 'ID Back';
      case 'selfie': return 'Selfie / Liveness Check';
    }
  }

  slotPreview(slot: DocSlot): string | null {
    if (slot === 'front') return this.idFrontPreview;
    if (slot === 'back') return this.idBackPreview;
    return this.selfiePreview;
  }

  slotHasNewFile(slot: DocSlot): boolean {
    if (slot === 'front') return !!this.idFrontFile;
    if (slot === 'back') return !!this.idBackFile;
    return !!this.selfieFile;
  }

  slotHasExisting(slot: DocSlot): boolean {
    return !!this.existingPreviews[slot];
  }

  existingStatus(slot: DocSlot): string | undefined {
    return this.existingPreviews[slot]?.label;
  }

  private canResolveTenant(): boolean {
    return !!this.tenantId || this.authService.isAuthenticated();
  }

  private resolveTenantContext() {
    this.resolvingContext = true;
    this.contextError = '';

    this.tenantService.getMyOnboardingContext().subscribe({
      next: (context) => {
        this.tenantId = context.tenantId;
        this.kycStatus = context.kycStatus || '';
        sessionStorage.setItem('tenantId', context.tenantId);
        if (!this.invitationCode && context.invitationCode) {
          this.invitationCode = context.invitationCode;
        }
        this.onboardingFlow = !!this.invitationCode || this.authService.isAuthenticated();
        this.resolvingContext = false;
        this.loadExistingDocuments();
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.resolvingContext = false;
        this.contextError = err.message || 'Unable to load your tenant profile.';
        this.cdr.markForCheck();
      }
    });
  }

  private loadExistingDocuments() {
    if (!this.authService.isAuthenticated()) {
      return;
    }

    this.loadingProfile = true;
    this.profileService.getMyProfile().subscribe({
      next: (profile) => {
        this.kycStatus = profile.kycStatus || this.kycStatus;
        this.existingDocs = profile.kycDocuments || [];
        this.galleryItems = this.existingDocs.map(doc => ({
          documentId: doc.documentId,
          label: doc.label,
          mimeType: doc.mimeType,
          fileName: doc.fileName,
          status: doc.status
        }));
        this.loadExistingPreviews();
        this.loadingProfile = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.loadingProfile = false;
        this.cdr.markForCheck();
      }
    });
  }

  private loadExistingPreviews() {
    this.revokePreviewUrls();
    this.existingPreviews = { front: null, back: null, selfie: null };

    for (const doc of this.existingDocs) {
      const slot = this.mapDocTypeToSlot(doc.docType);
      if (!slot || this.existingPreviews[slot]) {
        continue;
      }

      const preview: ExistingDocPreview = {
        documentId: doc.documentId,
        label: doc.label,
        mimeType: doc.mimeType,
        url: null,
        loading: true,
        failed: false
      };
      this.existingPreviews[slot] = preview;

      this.profileService.getMyDocument(doc.documentId).subscribe({
        next: (blob) => {
          const url = URL.createObjectURL(blob);
          this.previewUrls.push(url);
          const current = this.existingPreviews[slot];
          if (current) {
            this.existingPreviews[slot] = { ...current, url, loading: false, failed: false };
          }
          this.cdr.markForCheck();
        },
        error: () => {
          const current = this.existingPreviews[slot];
          if (current) {
            this.existingPreviews[slot] = { ...current, loading: false, failed: true };
          }
          this.cdr.markForCheck();
        }
      });
    }
  }

  private mapDocTypeToSlot(docType: string): DocSlot | null {
    switch ((docType || '').toUpperCase()) {
      case 'ID_FRONT': return 'front';
      case 'ID_BACK': return 'back';
      case 'SELFIE': return 'selfie';
      default: return null;
    }
  }

  private revokePreviewUrls() {
    this.previewUrls.forEach(url => URL.revokeObjectURL(url));
    this.previewUrls = [];
  }

  private isAllowedFile(file: File): boolean {
    const type = (file.type || '').toLowerCase();
    if (['image/jpeg', 'image/png', 'image/jpg', 'image/webp', 'application/pdf'].includes(type)) {
      return true;
    }
    if (type.startsWith('image/')) {
      return true;
    }
    const name = file.name.toLowerCase();
    return /\.(jpe?g|png|webp|pdf|heic|heif)$/.test(name);
  }

  onFileSelected(event: Event, type: DocSlot) {
    const input = event.target as HTMLInputElement;
    if (!input.files?.[0]) {
      return;
    }

    const file = input.files[0];

    if (file.size > 5 * 1024 * 1024) {
      this.showError('File size must be less than 5MB');
      input.value = '';
      return;
    }

    if (!this.isAllowedFile(file)) {
      this.showError('Only JPEG, PNG, or PDF files are allowed');
      input.value = '';
      return;
    }

    if (type === 'front') {
      this.idFrontFile = file;
    } else if (type === 'back') {
      this.idBackFile = file;
    } else {
      this.selfieFile = file;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const preview = e.target?.result as string;
      if (type === 'front') {
        this.idFrontPreview = preview;
      } else if (type === 'back') {
        this.idBackPreview = preview;
      } else {
        this.selfiePreview = preview;
      }
      this.cdr.markForCheck();
    };
    reader.readAsDataURL(file);
    this.cdr.markForCheck();
  }

  clearFile(type: DocSlot, event: Event) {
    event.stopPropagation();
    if (type === 'front') {
      this.idFrontFile = null;
      this.idFrontPreview = null;
    } else if (type === 'back') {
      this.idBackFile = null;
      this.idBackPreview = null;
    } else {
      this.selfieFile = null;
      this.selfiePreview = null;
    }
    this.cdr.markForCheck();
  }

  isFormValid(): boolean {
    return this.idFrontFile !== null &&
           this.idBackFile !== null &&
           this.selfieFile !== null;
  }

  onSubmit() {
    if (!this.canResolveTenant()) {
      this.showError('Complete identity verification before uploading documents.');
      return;
    }
    if (this.isUpdateMode) {
      if (!this.hasPendingUploads) {
        this.showError('Select at least one document to update');
        return;
      }
    } else if (!this.isFormValid()) {
      this.showError('Please upload all required documents');
      return;
    }

    const submitUpload = (tenantId: string) => {
      this.uploading = true;
      this.tenantService.uploadKycDocuments(tenantId, {
        idFront: this.idFrontFile || undefined,
        idBack: this.idBackFile || undefined,
        selfie: this.selfieFile || undefined
      }).subscribe({
        next: (response) => {
          this.uploading = false;
          this.tenantId = tenantId;
          sessionStorage.setItem('tenantId', tenantId);
          this.authService.updateKycStatus(response.kycStatus);

          const queryParams: Record<string, string> = { tenantId };
          if (this.invitationCode) {
            queryParams['code'] = this.invitationCode;
          }

          if (this.onboardingFlow) {
            this.router.navigate(['/tenant/onboarding/kyc-pending'], { queryParams });
            return;
          }

          this.toastType = 'success';
          this.toastMessage = response.message || 'Documents submitted for verification.';
          this.showToast = true;
          setTimeout(() => {
            this.router.navigate(['/tenant/onboarding/kyc-pending'], { queryParams });
          }, 1500);
        },
        error: (err) => {
          this.uploading = false;
          this.showError(err.message);
          this.cdr.markForCheck();
        }
      });
    };

    if (this.tenantId) {
      submitUpload(this.tenantId);
      return;
    }

    if (this.authService.isAuthenticated()) {
      this.resolvingContext = true;
      this.tenantService.getMyOnboardingContext().subscribe({
        next: (context) => {
          this.tenantId = context.tenantId;
          this.resolvingContext = false;
          submitUpload(context.tenantId);
        },
        error: (err) => {
          this.resolvingContext = false;
          this.showError(err.message || 'Unable to load your tenant profile.');
          this.cdr.markForCheck();
        }
      });
      return;
    }

    this.showError('Complete identity verification before uploading documents.');
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

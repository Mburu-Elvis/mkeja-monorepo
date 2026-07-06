import { Component, HostListener, Input, OnChanges, OnDestroy, SimpleChanges, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { AdminService } from '../../../core/services/admin.service';
import { ProfileService } from '../../../core/services/profile.service';
import { DocumentPreviewKind, resolveDocumentPreviewKindAsync } from '../../../core/utils/document-preview';
import { KycDocumentItem } from './kyc-document-item';

interface LoadedDocument {
  item: KycDocumentItem;
  url: string | null;
  safeUrl: SafeResourceUrl | null;
  kind: DocumentPreviewKind | null;
  loading: boolean;
  failed: boolean;
}

@Component({
  selector: 'app-kyc-document-gallery',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './kyc-document-gallery.html',
  styleUrls: ['./kyc-document-gallery.css']
})
export class KycDocumentGalleryComponent implements OnChanges, OnDestroy {
  private adminService = inject(AdminService);
  private profileService = inject(ProfileService);
  private cdr = inject(ChangeDetectorRef);
  private sanitizer = inject(DomSanitizer);

  @Input() documents: KycDocumentItem[] = [];
  @Input() documentSource: 'admin' | 'profile' = 'profile';
  @Input() emptyMessage = 'No documents uploaded.';

  loadedDocuments: LoadedDocument[] = [];
  activeIndex: number | null = null;

  private objectUrls: string[] = [];

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['documents']) {
      this.loadDocuments();
    }
  }

  ngOnDestroy(): void {
    this.closeViewer();
    this.revokeObjectUrls();
  }

  get activeDocument(): LoadedDocument | null {
    if (this.activeIndex == null || !this.loadedDocuments[this.activeIndex]) {
      return null;
    }
    return this.loadedDocuments[this.activeIndex];
  }

  get hasPrevious(): boolean {
    return this.activeIndex != null && this.activeIndex > 0;
  }

  get hasNext(): boolean {
    return this.activeIndex != null && this.activeIndex < this.loadedDocuments.length - 1;
  }

  get viewerCounter(): string {
    if (this.activeIndex == null) {
      return '';
    }
    return `${this.activeIndex + 1} of ${this.loadedDocuments.length}`;
  }

  @HostListener('document:keydown', ['$event'])
  onKeydown(event: KeyboardEvent): void {
    if (this.activeIndex == null) {
      return;
    }
    if (event.key === 'Escape') {
      event.preventDefault();
      this.closeViewer();
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault();
      this.showPrevious();
    } else if (event.key === 'ArrowRight') {
      event.preventDefault();
      this.showNext();
    }
  }

  openViewer(index: number): void {
    const doc = this.loadedDocuments[index];
    if (!doc || doc.loading || doc.failed || !doc.url) {
      return;
    }
    this.activeIndex = index;
    document.body.style.overflow = 'hidden';
  }

  closeViewer(): void {
    this.activeIndex = null;
    document.body.style.overflow = '';
  }

  showPrevious(): void {
    if (!this.hasPrevious || this.activeIndex == null) {
      return;
    }
    this.activeIndex -= 1;
  }

  showNext(): void {
    if (!this.hasNext || this.activeIndex == null) {
      return;
    }
    this.activeIndex += 1;
  }

  statusClass(status?: string): string {
    const normalized = (status || 'PENDING').toLowerCase().replace('_', '-');
    return normalized;
  }

  thumbnailIcon(kind: DocumentPreviewKind | null): string {
    if (kind === 'pdf') {
      return 'picture_as_pdf';
    }
    if (kind === 'image') {
      return 'image';
    }
    return 'description';
  }

  formatStatus(status: string): string {
    return status.replace(/_/g, ' ');
  }

  private loadDocuments(): void {
    this.closeViewer();
    this.revokeObjectUrls();
    this.loadedDocuments = [];

    if (!this.documents.length) {
      return;
    }

    this.loadedDocuments = this.documents.map(item => ({
      item,
      url: null,
      safeUrl: null,
      kind: null,
      loading: true,
      failed: false
    }));

    this.documents.forEach((item, index) => {
      const request = this.documentSource === 'admin'
        ? this.adminService.getKycDocument(item.documentId)
        : this.profileService.getMyDocument(item.documentId);

      request.subscribe({
        next: (blob) => {
          void this.applyBlob(index, item, blob);
        },
        error: () => {
          if (this.loadedDocuments[index]) {
            this.loadedDocuments[index] = {
              ...this.loadedDocuments[index],
              loading: false,
              failed: true
            };
            this.cdr.markForCheck();
          }
        }
      });
    });
  }

  private async applyBlob(index: number, item: KycDocumentItem, blob: Blob): Promise<void> {
    if (!this.loadedDocuments[index]) {
      return;
    }

    const url = URL.createObjectURL(blob);
    this.objectUrls.push(url);
    const kind = await resolveDocumentPreviewKindAsync(blob, item.mimeType, item.fileName);

    this.loadedDocuments[index] = {
      item,
      url,
      safeUrl: kind === 'pdf' ? this.sanitizer.bypassSecurityTrustResourceUrl(url) : null,
      kind,
      loading: false,
      failed: false
    };
    this.cdr.markForCheck();
  }

  private revokeObjectUrls(): void {
    this.objectUrls.forEach(url => URL.revokeObjectURL(url));
    this.objectUrls = [];
  }
}

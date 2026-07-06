import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserProfile } from '../../../core/services/profile.service';
import { KycDocumentGalleryComponent } from '../kyc-document-gallery/kyc-document-gallery';
import { KycDocumentItem } from '../kyc-document-gallery/kyc-document-item';

@Component({
  selector: 'app-user-profile-panels',
  standalone: true,
  imports: [CommonModule, KycDocumentGalleryComponent],
  templateUrl: './user-profile-panels.html',
  styleUrls: ['./user-profile-panels.css']
})
export class UserProfilePanelsComponent {
  @Input() profile: UserProfile | null = null;
  @Input() documentSource: 'admin' | 'profile' = 'profile';
  @Input() showAccountMeta = false;

  get isLandlordOrAgent(): boolean {
    const role = this.profile?.role;
    return role === 'LANDLORD' || role === 'AGENT';
  }

  get isTenant(): boolean {
    return this.profile?.role === 'TENANT';
  }

  get documentItems(): KycDocumentItem[] {
    return (this.profile?.kycDocuments || []).map(doc => ({
      documentId: doc.documentId,
      label: doc.label,
      mimeType: doc.mimeType,
      fileName: doc.fileName,
      status: doc.status
    }));
  }
}

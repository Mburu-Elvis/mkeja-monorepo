import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpService } from './http';

export interface UserKycDocument {
  documentId: string;
  docType: string;
  label: string;
  status?: string;
  fileName?: string;
  mimeType?: string;
  uploadedAt?: string;
}

/** PII/KYC fields shared by profile and admin user detail views. */
export interface UserProfileExtension {
  firstName?: string;
  lastName?: string;
  kycVerifiedAt?: string;
  otpVerified?: boolean;
  lockReason?: string;
  idType?: string;
  idNumber?: string;
  idVerified?: boolean;
  gender?: string;
  entityType?: string;
  ownerSubtype?: string;
  agentType?: string;
  companyName?: string;
  companyRegistrationNumber?: string;
  registrationNumber?: string;
  kraPin?: string;
  licenseNumber?: string;
  licenseExpiry?: string;
  physicalAddress?: string;
  city?: string;
  county?: string;
  website?: string;
  unitCount?: number;
  activeTenancyCount?: number;
  kycDocuments?: UserKycDocument[];
}

export interface UserProfile extends UserProfileExtension {
  id: string;
  fullName: string;
  phone: string;
  email?: string;
  role: string;
  status?: string;
  kycStatus?: string;
  joinedDate?: string;
  lastLoginAt?: string;
  propertyCount?: number;
  tenantCount?: number;
  tenancyCount?: number;
}

@Injectable({
  providedIn: 'root'
})
export class ProfileService {
  constructor(private http: HttpService) {}

  getMyProfile(): Observable<UserProfile> {
    return this.http.get<UserProfile>('/profile/me');
  }

  getMyDocument(documentId: string): Observable<Blob> {
    return this.http.getBlob(`/profile/me/documents/${documentId}`);
  }
}

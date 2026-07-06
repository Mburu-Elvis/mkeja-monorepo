import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpService } from './http';
import { AuthService } from './auth';
import {
  TenantRegisterPayload,
  TenantRegisterResponse,
  TenantProfile,
  KycDocumentUploadResponse,
  TenantOnboardingContext,
  TenantInvitationSummary,
  SecurityDepositResponse,
  RatibaOnboardingResponse,
  LeaseSummary,
  TenancyCreationResult
} from '../../models/onboarding.model';

@Injectable({
  providedIn: 'root'
})
export class TenantService {
  constructor(
    private http: HttpService,
    private auth: AuthService
  ) {}

  getTenantProfile(tenantId: string): Observable<TenantProfile> {
    return this.http.getPublic<TenantProfile>(`/onboarding/tenants/${tenantId}/profile`);
  }

  registerTenant(data: TenantRegisterPayload): Observable<TenantRegisterResponse> {
    return this.http.postPublic<TenantRegisterResponse>('/onboarding/tenants/register', data);
  }

  getMyOnboardingContext(): Observable<TenantOnboardingContext> {
    return this.http.get<TenantOnboardingContext>('/auth/tenant/onboarding');
  }

  listMyInvitations(): Observable<TenantInvitationSummary[]> {
    return this.http.get<TenantInvitationSummary[]>('/auth/tenant/invitations');
  }

  uploadKycDocuments(tenantId: string, files: { idFront?: File; idBack?: File; selfie?: File }): Observable<KycDocumentUploadResponse> {
    const formData = new FormData();
    if (files.idFront) formData.append('idFront', files.idFront);
    if (files.idBack) formData.append('idBack', files.idBack);
    if (files.selfie) formData.append('selfie', files.selfie);

    if (this.auth.isAuthenticated()) {
      return this.http.postMultipart<KycDocumentUploadResponse>('/auth/tenant/documents', formData);
    }

    return this.http.postPublicMultipart<KycDocumentUploadResponse>(`/onboarding/tenants/${tenantId}/documents`, formData);
  }

  initiateSecurityDeposit(tenantId: string): Observable<SecurityDepositResponse> {
    return this.http.postPublic<SecurityDepositResponse>(`/onboarding/tenants/${tenantId}/security-deposit`, {});
  }

  getSecurityDepositStatus(tenantId: string): Observable<SecurityDepositResponse> {
    return this.http.get<SecurityDepositResponse>(`/onboarding/tenants/${tenantId}/security-deposit/status`);
  }

  setPaymentPlan(tenantId: string, plan: 'DAILY' | 'WEEKLY' | 'MONTHLY'): Observable<{ message: string }> {
    return this.http.postPublic<{ message: string }>(`/onboarding/tenants/${tenantId}/payment-plan`, { plan });
  }

  setupRatiba(tenantId: string, plan: 'DAILY' | 'WEEKLY' | 'MONTHLY', amount: number): Observable<RatibaOnboardingResponse> {
    return this.http.postPublic<RatibaOnboardingResponse>(`/onboarding/tenants/${tenantId}/ratiba`, { plan, amount });
  }

  getLeaseSummary(tenantId: string, invitationCode: string): Observable<LeaseSummary> {
    return this.http.get<LeaseSummary>(`/onboarding/tenants/${tenantId}/lease`, { code: invitationCode });
  }

  signLease(tenantId: string, invitationCode: string): Observable<TenancyCreationResult> {
    return this.http.postPublic<TenancyCreationResult>(`/onboarding/tenants/${tenantId}/lease/sign`, { invitationCode });
  }
}

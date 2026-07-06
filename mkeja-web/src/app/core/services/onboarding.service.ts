import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpService } from './http';
import {
  LandlordOnboardingPayload,
  LandlordOnboardingResponse,
  KycDocumentUploadResponse
} from '../../models/onboarding.model';

@Injectable({
  providedIn: 'root'
})
export class OnboardingService {
  constructor(private http: HttpService) {}

  submitLandlordOnboarding(data: LandlordOnboardingPayload): Observable<LandlordOnboardingResponse> {
    return this.http.post<LandlordOnboardingResponse>('/onboarding/landlords', data);
  }

  submitAgentOnboarding(data: LandlordOnboardingPayload): Observable<LandlordOnboardingResponse> {
    return this.http.post<LandlordOnboardingResponse>('/onboarding/agents', data);
  }

  uploadLandlordDocuments(applicationId: string, docs: Record<string, string | null>): Observable<KycDocumentUploadResponse> {
    return this.http.post<KycDocumentUploadResponse>(`/onboarding/landlords/${applicationId}/documents`, docs);
  }

  getLandlordStatus(applicationId: string): Observable<{ applicationId: string; kycStatus: string; currentStep: number }> {
    return this.http.get(`/onboarding/landlords/${applicationId}/status`);
  }
}

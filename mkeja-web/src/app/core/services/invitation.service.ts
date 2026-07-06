import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpService } from './http';
import { CreateInvitationPayload, InvitationDetails } from '../../models/onboarding.model';

@Injectable({
  providedIn: 'root'
})
export class InvitationService {
  constructor(private http: HttpService) {}

  createInvitation(data: CreateInvitationPayload): Observable<InvitationDetails> {
    return this.http.post<InvitationDetails>('/invitations', data);
  }

  getInvitation(code: string): Observable<InvitationDetails> {
    return this.http.get<InvitationDetails>(`/invitations/${code}`);
  }

  acceptInvitation(code: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`/invitations/${code}/accept`, {});
  }
}

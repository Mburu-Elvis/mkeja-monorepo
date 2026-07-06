import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, BehaviorSubject, tap } from 'rxjs';
import { HttpService } from './http';
import { getStorageItem, removeStorageItem, setStorageItem } from '../utils/storage';

export type UserRole = 'TENANT' | 'LANDLORD' | 'AGENT' | 'ADMIN' | 'SUPER_ADMIN' | 'COMPLIANCE';
export type KycStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'MANUAL_REVIEW';

export interface User {
  id: string;
  fullName: string;
  phone: string;
  email?: string;
  role: UserRole;
  kycStatus: KycStatus;
  createdAt: Date;
}

export interface AuthResponse {
  otpRequired?: boolean;
  challengeId?: string;
  maskedPhone?: string;
  otpExpiresInSeconds?: number;
  access_token?: string;
  refresh_token?: string;
  token_type?: string;
  expires_in?: number;
  user?: User;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  currentUser$ = this.currentUserSubject.asObservable();

  constructor(
    private http: HttpService,
    private router: Router
  ) {
    this.loadStoredUser();
  }

  private loadStoredUser(): void {
    const userStr = getStorageItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        this.currentUserSubject.next(user);
      } catch {
        this.logout();
      }
    }
  }

  login(msisdn: string, pin: string): Observable<AuthResponse> {
    return this.http.postPublic<AuthResponse>('/auth/login', { phone: msisdn, pin }).pipe(
      tap(response => {
        if (!response.otpRequired) {
          this.storeAuthData(response);
        }
      })
    );
  }

  register(data: any): Observable<AuthResponse> {
    return this.http.postPublic<AuthResponse>('/auth/register', data).pipe(
      tap(response => {
        if (!response.otpRequired) {
          this.storeAuthData(response);
        }
      })
    );
  }

  verifyOtp(challengeId: string, phone: string, otp: string): Observable<AuthResponse> {
    return this.http.postPublic<AuthResponse>('/auth/verify-otp', { challengeId, phone, otp }).pipe(
      tap(response => this.storeAuthData(response))
    );
  }

  resendOtp(challengeId: string, phone: string): Observable<AuthResponse> {
    return this.http.postPublic<AuthResponse>('/auth/resend-otp', { challengeId, phone });
  }

  refreshToken(): Observable<AuthResponse> {
    return this.http.post<AuthResponse>('/auth/refresh', {}).pipe(
      tap(response => this.storeAuthData(response))
    );
  }

  /** Returns true when landlord KYC is approved (uses latest stored user). */
  isLandlordKycApproved(): boolean {
    return this.isKycApproved(this.getCurrentUser()?.kycStatus);
  }

  /** Returns true when tenant KYC is approved (uses latest stored user). */
  isTenantKycApproved(): boolean {
    return this.isKycApproved(this.getCurrentUser()?.kycStatus);
  }

  isKycApproved(status?: KycStatus | string | null): boolean {
    return status === 'APPROVED' || status === 'VERIFIED';
  }

  isKycPending(status?: KycStatus | string | null): boolean {
    return status === 'PENDING' || status === 'MANUAL_REVIEW' || !status;
  }

  isKycRejected(status?: KycStatus | string | null): boolean {
    return status === 'REJECTED';
  }

  private storeAuthData(response: AuthResponse): void {
    if (!response.access_token || !response.refresh_token || !response.user) {
      return;
    }
    setStorageItem('access_token', response.access_token);
    setStorageItem('refresh_token', response.refresh_token);
    setStorageItem('user', JSON.stringify(response.user));
    this.currentUserSubject.next(response.user);
  }

  getDashboardRole(role?: string): string {
    if (role === 'ADMIN' || role === 'SUPER_ADMIN') {
      return 'admin';
    }
    return (role || 'tenant').toLowerCase();
  }

  getUserFromResponse(response: AuthResponse): User | null {
    return response.user ?? null;
  }

  updateKycStatus(status: KycStatus): void {
    const user = this.getCurrentUser();
    if (!user) return;
    const updated = { ...user, kycStatus: status };
    setStorageItem('user', JSON.stringify(updated));
    this.currentUserSubject.next(updated);
  }

  logout(): void {
    removeStorageItem('access_token');
    removeStorageItem('refresh_token');
    removeStorageItem('user');
    this.currentUserSubject.next(null);
    this.router.navigate(['/auth/login']);
  }

  getAccessToken(): string | null {
    return getStorageItem('access_token');
  }

  getCurrentUser(): User | null {
    const userStr = getStorageItem('user');
    if (userStr) {
      try {
        return JSON.parse(userStr);
      } catch {
        return null;
      }
    }
    return null;
  }

  isAuthenticated(): boolean {
    const token = this.getAccessToken();
    if (!token) return false;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.exp > Date.now() / 1000;
    } catch {
      return !!token;
    }
  }

  hasRole(role: string): boolean {
    const user = this.getCurrentUser();
    if (!user) {
      return false;
    }
    if (role === 'LANDLORD') {
      return user.role === 'LANDLORD' || user.role === 'AGENT';
    }
    return user.role === role;
  }

  isSuperAdmin(): boolean {
    const user = this.getCurrentUser();
    if (user?.role === 'SUPER_ADMIN') {
      return true;
    }
    const token = this.getAccessToken();
    if (!token) {
      return false;
    }
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const rolesClaim = payload.roles;
      if (typeof rolesClaim === 'string') {
        return rolesClaim.split(',').map((r: string) => r.trim()).includes('ROLE_SUPER_ADMIN');
      }
      const authorities: string[] = payload.authorities || [];
      return authorities.some((a: string) => a === 'ROLE_SUPER_ADMIN' || a === 'SUPER_ADMIN');
    } catch {
      return false;
    }
  }
}

import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpService } from './http';
import { PropertySummary, UnitSummary } from './property.service';
import { UserProfileExtension } from './profile.service';

export interface KycApplication {
  id: string;
  fullName: string;
  idNumber: string;
  idType: string;
  phone?: string;
  email?: string;
  kraPin?: string;
  companyName?: string;
  landlordName: string;
  unitRef: string;
  submittedAt: string;
  status: string;
  applicantType: 'TENANT' | 'LANDLORD' | 'AGENT';
  licenseNumber?: string;
  documents?: Record<string, string>;
}

export interface AdminFinancialMetrics {
  monthlyRentRoll: number;
  totalSecurityDeposits: number;
  securityDepositsPending: number;
  securityDepositsApproved: number;
  activeStandingOrders: number;
  pendingStandingOrders: number;
  standingOrderVolume: number;
  estimatedMonthlyVolume: number;
}

export interface AdminBusinessMetrics {
  totalProperties: number;
  verifiedProperties: number;
  pendingProperties: number;
  totalUnits: number;
  occupiedUnits: number;
  vacantUnits: number;
  pendingInvitations: number;
  newUsersLast30Days: number;
  newLandlordsLast30Days: number;
  newTenantsLast30Days: number;
  newPropertiesLast30Days: number;
  occupancyRate: number;
}

export interface AdminOperationalMetrics {
  suspendedUsers: number;
  lockedUsers: number;
  pendingTenancies: number;
  failedStandingOrders: number;
  totalInvitations: number;
}

export interface AdminGrowthDataPoint {
  period: string;
  shortLabel: string;
  users: number;
  landlords: number;
  tenants: number;
  properties: number;
  rentRoll: number;
}

export interface AdminDashboardStats {
  totalUsers: number;
  totalLandlords: number;
  totalTenants: number;
  kycPending: number;
  kycManualReview: number;
  kycRejected: number;
  propertiesPendingVerification: number;
  activeTenancies: number;
  apiStatus: string;
  recentKycApplications: KycApplication[];
  pendingProperties: PropertySummary[];
  financial?: AdminFinancialMetrics;
  business?: AdminBusinessMetrics;
  operational?: AdminOperationalMetrics;
  growth?: AdminGrowthDataPoint[];
}

export interface AdminLedgerEntry {
  id: string;
  timestamp: string;
  type: string;
  amount: number;
  direction: 'CREDIT' | 'DEBIT';
  tenantName: string;
  reference: string;
  status: string;
  source: string;
}

export interface AdminDailyReport {
  date: string;
  newUsers: number;
  newTenants: number;
  newLandlords: number;
  newProperties: number;
  newTenancies: number;
  securityDeposits: number;
  securityDepositAmount: number;
  standingOrders: number;
  standingOrderAmount: number;
  rentRollActive: number;
  ledgerEntries: number;
  ledgerVolume: number;
  dataSource: string;
}

export interface AdminMonthlyReport {
  year: number;
  month: number;
  monthLabel: string;
  newUsers: number;
  newTenants: number;
  newLandlords: number;
  newProperties: number;
  newTenancies: number;
  securityDeposits: number;
  securityDepositAmount: number;
  standingOrders: number;
  standingOrderAmount: number;
  rentRollEndOfMonth: number;
  activeTenancies: number;
  activeLandlords: number;
  activeTenants: number;
  dailyBreakdown: AdminGrowthDataPoint[];
  dataSource: string;
}

export interface AdminUserSummary {
  id: string;
  fullName: string;
  phone: string;
  email?: string;
  role: string;
  status: 'active' | 'suspended';
  kycStatus: string;
  joinedDate: string;
  lastLoginAt?: string;
  propertyCount?: number;
  tenantCount?: number;
  tenancyCount?: number;
}

export interface AdminAccountSummary {
  id: string;
  fullName: string;
  phone: string;
  email: string;
  role: string;
  status: string;
  createdAt?: string;
}

export interface CreateAdminRequest {
  fullName: string;
  phone: string;
  email: string;
  pin: string;
}

export interface AdminPropertyItem {
  id: number;
  name: string;
  address?: string;
  city?: string;
  status?: string;
  totalUnits?: number;
  occupiedUnits?: number;
}

export interface AdminTenancyItem {
  id: number;
  propertyId?: number;
  unitId?: number;
  tenantUserId?: string;
  tenantName?: string;
  propertyName?: string;
  unitNumber?: string;
  status?: string;
  monthlyRent?: number;
  moveInDate?: string;
  leaseEndDate?: string;
}

export interface AdminUserDetail extends AdminUserSummary, UserProfileExtension {
  properties?: AdminPropertyItem[];
  tenancies?: AdminTenancyItem[];
}

export interface AdminTenancyDetail {
  id: number;
  tenantId?: number;
  tenantUserId?: string;
  tenantName?: string;
  tenantPhone?: string;
  unitId?: number;
  unitNumber?: string;
  propertyId?: number;
  propertyName?: string;
  landlordName?: string;
  status?: string;
  monthlyRent?: number;
  moveInDate?: string;
  moveOutDate?: string;
  leaseStartDate?: string;
  leaseEndDate?: string;
  leaseId?: number;
}

export interface AdminPropertyDetail {
  property: PropertySummary;
  landlordName?: string;
  landlordUserId?: string;
  units: UnitSummary[];
}

export interface AdminInvitationItem {
  id: number;
  code: string;
  status: string;
  tenantName?: string;
  tenantPhone?: string;
  landlordName?: string;
  landlordUserId?: string;
  propertyName?: string;
  propertyId?: number;
  unitNumber?: string;
  unitId?: number;
  monthlyRent?: number;
  leaseStartDate?: string;
  expiresAt?: string;
  createdAt?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  constructor(private http: HttpService) {}

  getDashboard(): Observable<AdminDashboardStats> {
    return this.http.get<AdminDashboardStats>('/admin/dashboard');
  }

  listKycApplications(): Observable<KycApplication[]> {
    return this.http.get<KycApplication[]>('/admin/kyc-queue');
  }

  getKycApplication(id: string, type: string): Observable<KycApplication> {
    return this.http.get<KycApplication>(`/admin/kyc-queue/${id}`, { type });
  }

  approveKyc(id: string, type: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`/admin/kyc-queue/${id}/approve?type=${type}`, {});
  }

  rejectKyc(id: string, type: string, reason?: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(
      `/admin/kyc-queue/${id}/reject?type=${type}`,
      reason ? { reason } : {}
    );
  }

  flagKyc(id: string, type: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`/admin/kyc-queue/${id}/flag?type=${type}`, {});
  }

  getKycDocument(documentId: string): Observable<Blob> {
    return this.http.getBlob(`/admin/kyc-queue/documents/${documentId}`);
  }

  listUsers(params?: { role?: string; status?: string; search?: string; kycStatus?: string }): Observable<AdminUserSummary[]> {
    return this.http.get<AdminUserSummary[]>('/admin/users', params);
  }

  getUser(id: string): Observable<AdminUserDetail> {
    return this.http.get<AdminUserDetail>(`/admin/users/${id}`);
  }

  updateUser(id: string, data: { fullName?: string; email?: string }): Observable<AdminUserDetail> {
    return this.http.patch<AdminUserDetail>(`/admin/users/${id}`, data);
  }

  toggleUserStatus(id: string): Observable<AdminUserDetail> {
    return this.http.post<AdminUserDetail>(`/admin/users/${id}/toggle-status`, {});
  }

  listPendingProperties(): Observable<PropertySummary[]> {
    return this.http.get<PropertySummary[]>('/admin/properties/pending');
  }

  listProperties(status?: string): Observable<PropertySummary[]> {
    const params = status && status !== 'all' ? { status } : undefined;
    return this.http.get<PropertySummary[]>('/admin/properties', params);
  }

  getLedger(params?: { type?: string; search?: string; startDate?: string; endDate?: string }): Observable<AdminLedgerEntry[]> {
    return this.http.get<AdminLedgerEntry[]>('/admin/reports/ledger', params);
  }

  getDailyReport(date?: string): Observable<AdminDailyReport> {
    return this.http.get<AdminDailyReport>('/admin/reports/daily', date ? { date } : undefined);
  }

  getMonthlyReport(year?: number, month?: number): Observable<AdminMonthlyReport> {
    const params: Record<string, number> = {};
    if (year != null) params['year'] = year;
    if (month != null) params['month'] = month;
    return this.http.get<AdminMonthlyReport>('/admin/reports/monthly', Object.keys(params).length ? params : undefined);
  }

  verifyProperty(propertyId: number): Observable<PropertySummary> {
    return this.http.post<PropertySummary>(`/admin/properties/${propertyId}/verify`, {});
  }

  deleteProperty(propertyId: number): Observable<void> {
    return this.http.delete<void>(`/admin/properties/${propertyId}`);
  }

  rejectProperty(propertyId: number): Observable<PropertySummary> {
    return this.http.post<PropertySummary>(`/admin/properties/${propertyId}/reject`, {});
  }

  listTenancies(params?: { status?: string; search?: string }): Observable<AdminTenancyDetail[]> {
    return this.http.get<AdminTenancyDetail[]>('/admin/tenancies', params);
  }

  getTenancy(tenancyId: number): Observable<AdminTenancyDetail> {
    return this.http.get<AdminTenancyDetail>(`/admin/tenancies/${tenancyId}`);
  }

  terminateTenancy(tenancyId: number): Observable<AdminTenancyDetail> {
    return this.http.post<AdminTenancyDetail>(`/admin/tenancies/${tenancyId}/terminate`, {});
  }

  reassignTenancy(tenancyId: number, unitId: number): Observable<AdminTenancyDetail> {
    return this.http.patch<AdminTenancyDetail>(`/admin/tenancies/${tenancyId}/reassign`, { unitId });
  }

  getPropertyDetail(propertyId: number): Observable<AdminPropertyDetail> {
    return this.http.get<AdminPropertyDetail>(`/admin/properties/${propertyId}`);
  }

  listVacantUnits(propertyId: number): Observable<UnitSummary[]> {
    return this.http.get<UnitSummary[]>(`/admin/properties/${propertyId}/vacant-units`);
  }

  listInvitations(params?: { status?: string; search?: string }): Observable<AdminInvitationItem[]> {
    return this.http.get<AdminInvitationItem[]>('/admin/invitations', params);
  }

  cancelInvitation(invitationId: number): Observable<AdminInvitationItem> {
    return this.http.post<AdminInvitationItem>(`/admin/invitations/${invitationId}/cancel`, {});
  }

  listAdminAccounts(): Observable<AdminAccountSummary[]> {
    return this.http.get<AdminAccountSummary[]>('/admin/admins');
  }

  createAdminAccount(data: CreateAdminRequest): Observable<AdminAccountSummary> {
    return this.http.post<AdminAccountSummary>('/admin/admins', data);
  }
}

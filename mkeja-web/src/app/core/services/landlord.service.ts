import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpService } from './http';

export interface LandlordTenantSummary {
  tenancyId: number;
  tenantId: number;
  tenantName: string;
  tenantPhone: string;
  kycStatus: string;
  tenancyStatus: string;
  propertyId: number;
  propertyName: string;
  unitNumber: string;
  unitId: number;
  floorNumber?: number;
  wing?: string;
  monthlyRent: number;
  rentDueDay?: number;
  leaseStartDate?: string;
  leaseEndDate?: string;
  source: string;
}

export interface LandlordInvitationSummary {
  code: string;
  status: string;
  tenantName: string;
  tenantPhone: string;
  propertyId: number;
  propertyName: string;
  unitNumber: string;
  unitId: number;
  floorNumber?: number;
  wing?: string;
  monthlyRent: number;
  rentDueDay?: number;
  leaseStartDate?: string;
  expiresAt?: string;
  existingTenant: boolean;
}

export interface TenantLookupResult {
  registered: boolean;
  fullName?: string;
  phone: string;
  kycStatus?: string;
  canLinkImmediately: boolean;
  message: string;
}

export interface TenancyHistoryItem {
  tenancyId: number;
  tenantId?: number;
  tenantName?: string;
  tenantPhone?: string;
  status: string;
  leaseStartDate?: string;
  leaseEndDate?: string;
  moveInDate?: string;
  moveOutDate?: string;
  monthlyRent?: number;
  rentDueDay?: number;
}

export interface UnitHistory {
  unitId: number;
  propertyId: number;
  propertyName: string;
  unitNumber: string;
  floorNumber?: number;
  wing?: string;
  rent: number;
  status: string;
  tenancies: TenancyHistoryItem[];
}

export interface TenantTenancyItem {
  tenancyId: number;
  propertyName?: string;
  propertyAddress?: string;
  unitNumber?: string;
  floorNumber?: number;
  wing?: string;
  status: string;
  leaseStartDate?: string;
  leaseEndDate?: string;
  moveInDate?: string;
  moveOutDate?: string;
  monthlyRent?: number;
  rentDueDay?: number;
  landlordName?: string;
}

@Injectable({ providedIn: 'root' })
export class LandlordService {
  constructor(private http: HttpService) {}

  listTenants(params?: { propertyId?: number; floor?: number; search?: string }): Observable<LandlordTenantSummary[]> {
    return this.http.get<LandlordTenantSummary[]>('/landlord/tenants', params);
  }

  getTenant(tenantId: number): Observable<LandlordTenantSummary> {
    return this.http.get<LandlordTenantSummary>(`/landlord/tenants/${tenantId}`);
  }

  listPendingInvitations(params?: { propertyId?: number; floor?: number; search?: string }): Observable<LandlordInvitationSummary[]> {
    return this.http.get<LandlordInvitationSummary[]>('/landlord/invitations', params);
  }

  getUnitHistory(unitId: number): Observable<UnitHistory> {
    return this.http.get<UnitHistory>(`/landlord/units/${unitId}/history`);
  }

  lookupTenant(phone: string): Observable<TenantLookupResult> {
    return this.http.get<TenantLookupResult>('/landlord/tenant-lookup', { phone });
  }
}

import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpService } from './http';

export interface PropertySummary {
  id: number;
  name: string;
  propertyType?: string;
  description?: string;
  address?: string;
  city?: string;
  county?: string;
  totalUnits: number;
  propertyStatus: string;
  verified: boolean;
  vacantUnits: number;
  occupiedUnits: number;
  rentDueDay?: number;
  gracePeriodDays?: number;
  pendingInvites?: number;
  monthlyRentRoll?: number;
  nextRentDueLabel?: string;
  houseHuntEnabled?: boolean;
  autoRecommendEnabled?: boolean;
  coverImageUrl?: string;
}

export interface UnitSummary {
  id: number;
  propertyId: number;
  propertyName?: string;
  unitNumber: string;
  floorNumber?: number;
  wing?: string;
  unitType?: string;
  rent: number;
  deposit?: number;
  status: string;
  qrCodeUrl?: string;
  rentDueDay?: number;
  tenantName?: string;
  tenantPhone?: string;
  tenancyStatus?: string;
  pendingInvite?: boolean;
  pendingInviteCode?: string;
  discoverable?: boolean;
  autoRecommend?: boolean;
  promoted?: boolean;
  listingDescription?: string;
  availableFrom?: string;
}

export interface UnitListingSummary {
  unitId: number;
  unitNumber: string;
  status: string;
  discoverable: boolean;
  autoRecommend: boolean;
  promoted: boolean;
  listingDescription?: string;
  rent?: number;
  coverImageUrl?: string;
  imageUrls?: string[];
}

export interface HouseHuntSettings {
  propertyId: number;
  propertyName: string;
  verified: boolean;
  houseHuntEnabled: boolean;
  autoRecommendEnabled: boolean;
  vacantUnits: number;
  listedUnits: number;
  autoRecommendUnits: number;
  units: UnitListingSummary[];
}

export interface PropertyImage {
  id: number;
  propertyId: number;
  unitId?: number;
  unitType?: string;
  url: string;
  caption?: string;
  primary: boolean;
  sortOrder: number;
}

@Injectable({
  providedIn: 'root'
})
export class PropertyService {
  constructor(private http: HttpService) {}

  listProperties(): Observable<PropertySummary[]> {
    return this.http.get<PropertySummary[]>('/properties');
  }

  getProperty(propertyId: number): Observable<PropertySummary> {
    return this.http.get<PropertySummary>(`/properties/${propertyId}`);
  }

  listUnits(propertyId: number, vacantOnly = false): Observable<UnitSummary[]> {
    return this.http.get<UnitSummary[]>(`/properties/${propertyId}/units`, { vacant: vacantOnly });
  }

  listPropertyUnitTypes(propertyId: number): Observable<string[]> {
    return this.http.get<string[]>(`/properties/${propertyId}/unit-types`);
  }

  listVacantUnits(): Observable<UnitSummary[]> {
    return this.http.get<UnitSummary[]>('/properties/vacant-units');
  }

  createUnit(propertyId: number, payload: unknown): Observable<UnitSummary> {
    return this.http.post<UnitSummary>(`/properties/${propertyId}/units/wizard`, payload);
  }

  updateUnit(propertyId: number, unitId: number, payload: {
    unitType?: string;
    rent?: number;
    deposit?: number;
    floorNumber?: number;
    wing?: string;
    status?: string;
  }): Observable<UnitSummary> {
    return this.http.patch<UnitSummary>(`/properties/${propertyId}/units/${unitId}`, payload);
  }

  createProperty(formData: FormData): Observable<PropertySummary> {
    return this.http.postMultipart<PropertySummary>('/properties', formData);
  }

  getHouseHuntSettings(propertyId: number): Observable<HouseHuntSettings> {
    return this.http.get<HouseHuntSettings>(`/properties/${propertyId}/house-hunt`);
  }

  updateHouseHuntSettings(propertyId: number, payload: {
    houseHuntEnabled?: boolean;
    autoRecommendEnabled?: boolean;
  }): Observable<HouseHuntSettings> {
    return this.http.patch<HouseHuntSettings>(`/properties/${propertyId}/house-hunt`, payload);
  }

  getUnitListing(propertyId: number, unitId: number): Observable<UnitSummary> {
    return this.http.get<UnitSummary>(`/properties/${propertyId}/units/${unitId}/listing`);
  }

  updateUnitListing(propertyId: number, unitId: number, payload: {
    promoted?: boolean;
    listingDescription?: string;
    availableFrom?: string;
  }): Observable<UnitSummary> {
    return this.http.patch<UnitSummary>(`/properties/${propertyId}/units/${unitId}/listing`, payload);
  }

  listPropertyImages(propertyId: number): Observable<PropertyImage[]> {
    return this.http.get<PropertyImage[]>(`/properties/${propertyId}/images`);
  }

  uploadPropertyImage(propertyId: number, file: File, caption?: string): Observable<PropertyImage> {
    const formData = new FormData();
    formData.append('file', file);
    if (caption) {
      formData.append('caption', caption);
    }
    return this.http.postMultipart<PropertyImage>(`/properties/${propertyId}/images`, formData);
  }

  uploadUnitTypeSampleImage(propertyId: number, unitType: string, file: File, caption?: string): Observable<PropertyImage> {
    const formData = new FormData();
    formData.append('file', file);
    if (caption) {
      formData.append('caption', caption);
    }
    return this.http.postMultipart<PropertyImage>(`/properties/${propertyId}/unit-types/${unitType}/images`, formData);
  }

  listOverviewImages(propertyId: number): Observable<PropertyImage[]> {
    return this.http.get<PropertyImage[]>(`/properties/${propertyId}/images/overview`);
  }

  listUnitTypeSampleImages(propertyId: number, unitType: string): Observable<PropertyImage[]> {
    return this.http.get<PropertyImage[]>(`/properties/${propertyId}/unit-types/${unitType}/images`);
  }
}

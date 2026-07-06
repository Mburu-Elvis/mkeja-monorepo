import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpService } from './http';

export interface UnitTypeBreakdown {
  unitType: string;
  label: string;
  availableCount: number;
  minRent?: number;
  maxRent?: number;
  sampleImageUrl?: string;
  imageUrls?: string[];
}

export interface PropertyDiscoveryListing {
  propertyId: number;
  propertyName: string;
  description?: string;
  address?: string;
  city?: string;
  county?: string;
  coverImageUrl?: string;
  imageUrls?: string[];
  availableUnits: number;
  minRent?: number;
  maxRent?: number;
  unitTypes?: UnitTypeBreakdown[];
  verifiedProperty: boolean;
  verifiedLandlord: boolean;
  promoted: boolean;
  saved: boolean;
  matchReasons?: string[];
  matchScore?: number;
}

export interface AvailableUnitListing {
  unitId: number;
  unitNumber: string;
  floorNumber?: number;
  wing?: string;
  unitType?: string;
  unitTypeLabel?: string;
  bedrooms?: number;
  bathrooms?: number;
  rent?: number;
  deposit?: number;
  listingDescription?: string;
  availableFrom?: string;
  promoted: boolean;
  saved: boolean;
  sampleImageUrl?: string;
}

export interface PropertyDiscoveryDetail extends PropertyDiscoveryListing {
  units: AvailableUnitListing[];
  landlordName?: string;
}

export interface DiscoveryListing {
  unitId: number;
  propertyId: number;
  propertyName: string;
  unitNumber: string;
  address?: string;
  city?: string;
  county?: string;
  rent?: number;
  deposit?: number;
  bedrooms?: number;
  bathrooms?: number;
  unitType?: string;
  listingDescription?: string;
  availableFrom?: string;
  landlordName?: string;
  verifiedProperty: boolean;
  verifiedLandlord: boolean;
  autoRecommend: boolean;
  promoted: boolean;
  saved: boolean;
  coverImageUrl?: string;
  imageUrls?: string[];
  matchReasons?: string[];
  matchScore?: number;
}

export interface TenantDiscoveryPreferences {
  minRent?: number;
  maxRent?: number;
  preferredCounty?: string;
  preferredCity?: string;
  minBedrooms?: number;
  moveByDate?: string;
}

export interface ListingInterest {
  id: number;
  unitId: number;
  propertyId: number;
  tenantName: string;
  tenantPhone: string;
  unitLabel?: string;
  propertyName?: string;
  monthlyRent?: number;
  status: string;
  message?: string;
  createdAt?: string;
}

@Injectable({ providedIn: 'root' })
export class DiscoveryService {
  constructor(private http: HttpService) {}

  searchProperties(params?: {
    q?: string;
    county?: string;
    city?: string;
    minRent?: number;
    maxRent?: number;
    minBedrooms?: number;
  }): Observable<PropertyDiscoveryListing[]> {
    return this.http.get<PropertyDiscoveryListing[]>('/discovery/properties', params);
  }

  searchPropertiesPublic(params?: {
    q?: string;
    county?: string;
    city?: string;
    minRent?: number;
    maxRent?: number;
    minBedrooms?: number;
  }): Observable<PropertyDiscoveryListing[]> {
    return this.http.getPublic<PropertyDiscoveryListing[]>('/discovery/properties', params);
  }

  getPropertyListing(propertyId: number): Observable<PropertyDiscoveryDetail> {
    return this.http.get<PropertyDiscoveryDetail>(`/discovery/properties/${propertyId}`);
  }

  getPropertyListingPublic(propertyId: number): Observable<PropertyDiscoveryDetail> {
    return this.http.getPublic<PropertyDiscoveryDetail>(`/discovery/properties/${propertyId}`);
  }

  searchListings(params?: {
    q?: string;
    county?: string;
    city?: string;
    minRent?: number;
    maxRent?: number;
    minBedrooms?: number;
  }): Observable<DiscoveryListing[]> {
    return this.http.get<DiscoveryListing[]>('/discovery/listings', params);
  }

  getListing(unitId: number): Observable<DiscoveryListing> {
    return this.http.get<DiscoveryListing>(`/discovery/listings/${unitId}`);
  }

  getRecommendations(limit = 20): Observable<PropertyDiscoveryListing[]> {
    return this.http.get<PropertyDiscoveryListing[]>('/discovery/recommendations', { limit });
  }

  getSaved(): Observable<DiscoveryListing[]> {
    return this.http.get<DiscoveryListing[]>('/discovery/saved');
  }

  saveListing(unitId: number): Observable<DiscoveryListing> {
    return this.http.post<DiscoveryListing>(`/discovery/listings/${unitId}/save`, {});
  }

  unsaveListing(unitId: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`/discovery/listings/${unitId}/save`);
  }

  expressInterest(unitId: number, message?: string): Observable<ListingInterest> {
    return this.http.post<ListingInterest>(`/discovery/listings/${unitId}/interest`, message ? { message } : {});
  }

  expressPublicInterest(
    unitId: number,
    data: { fullName: string; phone: string; message?: string }
  ): Observable<ListingInterest> {
    return this.http.postPublic<ListingInterest>(`/discovery/listings/${unitId}/public-interest`, data);
  }

  getPreferences(): Observable<TenantDiscoveryPreferences> {
    return this.http.get<TenantDiscoveryPreferences>('/discovery/preferences');
  }

  updatePreferences(prefs: TenantDiscoveryPreferences): Observable<TenantDiscoveryPreferences> {
    return this.http.put<TenantDiscoveryPreferences>('/discovery/preferences', prefs);
  }

  listLandlordLeads(): Observable<ListingInterest[]> {
    return this.http.get<ListingInterest[]>('/discovery/leads');
  }

  markLeadContacted(leadId: number): Observable<ListingInterest> {
    return this.http.post<ListingInterest>(`/discovery/leads/${leadId}/contacted`, {});
  }

  declineLead(leadId: number): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`/discovery/leads/${leadId}/decline`, {});
  }
}

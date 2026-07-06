import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface AddPropertyResponse {
  propertyId: string;
  status: 'pending' | 'active' | 'requires_verification';
  message: string;
  unitsGenerated: number;
  qrCodeUrl: string;
}

@Injectable({
  providedIn: 'root'
})
export class AddPropertyService {
  private baseUrl = '/api/v1';

  constructor(private http: HttpClient) {}

  addProperty(formData: FormData): Observable<AddPropertyResponse> {
    return this.http.post<AddPropertyResponse>(`${this.baseUrl}/properties`, formData);
  }

  verifyProperty(propertyId: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/properties/${propertyId}/verify`, {});
  }

  getPropertyTypes(): Observable<string[]> {
    return this.http.get<string[]>(`${this.baseUrl}/reference/property-types`);
  }

  getCounties(): Observable<string[]> {
    return this.http.get<string[]>(`${this.baseUrl}/reference/counties`);
  }
}
import { Injectable } from '@angular/core';
import { Observable, of, delay } from 'rxjs';
import { HttpService } from './http';

@Injectable({
  providedIn: 'root'
})
export class LandlordService {
  constructor(private http: HttpService) {}

  registerLandlord(data: any): Observable<any> {
    return of({
      landlordId: 'landlord-' + Date.now(),
      kycStatus: 'PENDING',
      paybillShortcode: '522533',
      dashboardUrl: 'https://dashboard.mkeja.co.ke'
    }).pipe(delay(1000));
  }

  getProperties(landlordId: string): Observable<any[]> {
    return of([
      { propertyId: '1', address: 'Kimathi Street, Nairobi', unitsCount: 8, occupiedCount: 7 }
    ]).pipe(delay(500));
  }

  addUnit(landlordId: string, unitData: any): Observable<any> {
    return of({
      unitId: 'unit-' + Date.now(),
      ...unitData
    }).pipe(delay(1000));
  }

  getTenants(landlordId: string, status?: string, page: number = 1): Observable<any> {
    return of({
      tenants: [
        { tenantId: '1', fullName: 'Jane Akinyi', unitRef: 'A1', monthlyRent: 5000, kycStatus: 'approved' }
      ],
      total: 1,
      page: 1
    }).pipe(delay(500));
  }

  getRemittances(landlordId: string, year?: number, month?: number): Observable<any[]> {
    return of([
      { period: 'March 2026', grossAmount: 75000, fee: 1875, netAmount: 73125, status: 'sent' }
    ]).pipe(delay(500));
  }

  linkBankAccount(landlordId: string, bankData: any): Observable<any> {
    return of({
      status: 'success',
      message: 'Bank account linked successfully'
    }).pipe(delay(1000));
  }
}
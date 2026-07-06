import { Injectable } from '@angular/core';
import { Observable, of, delay } from 'rxjs';
import { HttpService } from './http';

export type PaymentStatus = 'PENDING' | 'SUCCESS' | 'FAILED';

export interface Contribution {
  contributionId: string;
  tenantId: string;
  walletId: string;
  amount: number;
  mpesaRef: string;
  status: PaymentStatus;
  createdAt: Date;
}

@Injectable({
  providedIn: 'root'
})
export class PaymentService {
  constructor(private http: HttpService) {}

  getPaymentHistory(tenantId: string, page: number = 1, limit: number = 50): Observable<{
    contributions: Contribution[];
    total: number;
    page: number;
  }> {
    const status: PaymentStatus = 'SUCCESS';
    return of({
      contributions: [
        {
          contributionId: '1',
          tenantId: tenantId,
          walletId: 'wallet-1',
          amount: 167,
          mpesaRef: 'MPESA-001',
          status: status,
          createdAt: new Date()
        }
      ],
      total: 1,
      page: 1
    }).pipe(delay(500));
  }

  getRentProgress(tenantId: string): Observable<{
    paidAmount: number;
    monthlyRent: number;
    percentComplete: number;
    daysUntilDue: number;
  }> {
    return of({
      paidAmount: 3400,
      monthlyRent: 5000,
      percentComplete: 68,
      daysUntilDue: 5
    }).pipe(delay(500));
  }
}
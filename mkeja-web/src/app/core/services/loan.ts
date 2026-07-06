import { Injectable } from '@angular/core';
import { Observable, of, delay } from 'rxjs';
import { HttpService } from './http';

export type LoanStatus = 'ACTIVE' | 'REPAID' | 'DEFAULT';

export interface Loan {
  loanId: string;
  tenantId: string;
  walletId: string;
  principal: number;
  fee: number;
  totalRepayable: number;
  outstanding: number;
  creditTier: string;
  status: LoanStatus;
  disbursedAt: Date;
  fullyRepaidAt?: Date;
}

export interface LoanRequest {
  tenantId: string;
  walletId: string;
  requestedAmount: number;
  purpose: string;
}

@Injectable({
  providedIn: 'root'
})
export class LoanService {
  constructor(private http: HttpService) {}

  getActiveLoan(tenantId: string): Observable<Loan | null> {
    return of(null).pipe(delay(500));
  }

  requestLoan(request: LoanRequest): Observable<Loan> {
    const status: LoanStatus = 'ACTIVE';
    return of({
      loanId: 'loan-' + Date.now(),
      tenantId: request.tenantId,
      walletId: request.walletId,
      principal: request.requestedAmount,
      fee: Math.floor(request.requestedAmount * 0.04),
      totalRepayable: Math.floor(request.requestedAmount * 1.04),
      outstanding: Math.floor(request.requestedAmount * 1.04),
      creditTier: 'SILVER',
      status: status,
      disbursedAt: new Date()
    }).pipe(delay(1500));
  }

  getCreditScore(tenantId: string): Observable<{
    score: number;
    tier: string;
    limit: number;
    nextTier: { tier: string; scoreNeeded: number };
  }> {
    return of({
      score: 620,
      tier: 'Silver',
      limit: 3750,
      nextTier: { tier: 'Gold', scoreNeeded: 30 }
    }).pipe(delay(500));
  }
}
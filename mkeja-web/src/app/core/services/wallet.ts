import { Injectable } from '@angular/core';
import { Observable, of, delay } from 'rxjs';
import { HttpService } from './http';

export type WalletStatus = 'ACTIVE' | 'FROZEN' | 'CLOSED';
export type LedgerDirection = 'CREDIT' | 'DEBIT';

export interface Wallet {
  walletId: string;
  tenantId: string;
  availableBalance: number;
  securityHold: number;
  loanBalance: number;
  creditLimit: number;
  pendingSweep: number;
  currency: string;
  status: WalletStatus;
  lastUpdated: Date;
}

export interface LedgerEntry {
  entryId: string;
  walletId: string;
  type: string;
  direction: LedgerDirection;
  amount: number;
  balanceAfter: number;
  mpesaRef?: string;
  description: string;
  createdAt: Date;
}

@Injectable({
  providedIn: 'root'
})
export class WalletService {
  constructor(private http: HttpService) {}

  getBalance(walletId: string): Observable<Wallet> {
    const status: WalletStatus = 'ACTIVE';
    return of({
      walletId: walletId,
      tenantId: 'tenant-123',
      availableBalance: 3400,
      securityHold: 5000,
      loanBalance: 0,
      creditLimit: 3750,
      pendingSweep: 0,
      currency: 'KES',
      status: status,
      lastUpdated: new Date()
    }).pipe(delay(500));
  }

  getLedgerEntries(
    walletId: string, 
    fromDate?: Date, 
    toDate?: Date, 
    page: number = 1, 
    limit: number = 50
  ): Observable<{ entries: LedgerEntry[]; total: number; page: number }> {
    const direction: LedgerDirection = 'CREDIT';
    return of({
      entries: [
        {
          entryId: '1',
          walletId: walletId,
          type: 'CONTRIBUTION',
          direction: direction,
          amount: 167,
          balanceAfter: 3400,
          mpesaRef: 'MPESA-001',
          description: 'Daily rent contribution',
          createdAt: new Date()
        }
      ],
      total: 1,
      page: 1
    }).pipe(delay(500));
  }

  topUp(msisdn: string, amount: number, walletId: string): Observable<{ stkRef: string }> {
    return of({ stkRef: 'STK-' + Date.now() }).pipe(delay(1000));
  }
}
// shared/services/fuliza.service.ts
import { Injectable } from '@angular/core';
import { Observable, of, delay } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class FulizaService {
  
  getFulizaData(): Observable<any> {
    return of({
      creditScore: 672,
      creditTier: 'SILVER',
      availableLimit: 3750,
      totalLimit: 5000,
      utilizedAmount: 1250,
      outstandingLoan: 1250,
      activeLoan: {
        id: 'loan-002',
        amount: 1250,
        fee: 50,
        totalRepayable: 1300,
        repaid: 50,
        status: 'ACTIVE',
        date: new Date(2026, 3, 15),
        purpose: 'Rent shortfall - April 2026'
      },
      loanHistory: [
        {
          id: 'loan-001',
          amount: 1800,
          fee: 72,
          totalRepayable: 1872,
          repaid: 1872,
          status: 'REPAID',
          date: new Date(2026, 2, 15),
          repaidDate: new Date(2026, 2, 28),
          purpose: 'Rent shortfall - March 2026'
        }
      ],
      autoTopUpEnabled: true,
      totalInterestPaid: 187,
      totalBorrowed: 4250
    }).pipe(delay(300));
  }
  
  refreshFulizaData(): Observable<any> {
    return of({ success: true }).pipe(delay(500));
  }
}
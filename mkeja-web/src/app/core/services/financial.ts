// shared/services/financial.service.ts
import { Injectable, inject } from '@angular/core';
import { Observable, of, delay } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class FinancialService {
  
  getTenantData(): Observable<any> {
    return of({
      id: 't-001-kenya',
      name: 'Jane Akinyi Otieno',
      firstName: 'Jane',
      lastName: 'Otieno',
      email: 'jane.otieno@example.com',
      phone: '254712345678',
      kycStatus: 'APPROVED',
      joinedDate: new Date(2025, 10, 15)
    }).pipe(delay(300));
  }
  
  getPropertyData(): Observable<any> {
    return of({
      address: 'Sunset Apartments, Ngong Road, Nairobi',
      unitName: 'Apartment A1',
      unitRef: 'SA-A1-001',
      landlordName: 'John Mburu',
      landlordPhone: '+254712345678',
      landlordEmail: 'john.mburu@sunsetproperties.co.ke',
      leaseStart: new Date(2025, 11, 1),
      leaseEnd: new Date(2026, 10, 30),
      status: 'ACTIVE',
      graceDays: 3,
      dueDay: 5
    }).pipe(delay(300));
  }
  
  getFinancialData(): Observable<any> {
    return of({
      monthlyRent: 5000,
      securityDeposit: 5000,
      paidToDate: 3400,
      currentBalance: 3400,
      pendingSweep: 0,
      lastPaymentDate: new Date(2026, 3, 21),
      lastPaymentAmount: 167,
      nextDueDate: new Date(2026, 4, 5),
      paymentPlan: 'DAILY',
      paymentStats: {
        onTimeRate: 94,
        consistencyScore: 88,
        averageContribution: 165,
        totalPaidLifetime: 42500
      },
      recentTransactions: [
        { id: '1', type: 'credit', amount: 167, description: 'Daily rent contribution', date: new Date(2026, 3, 21, 6, 5), reference: 'REF001', category: 'Rent' },
        { id: '2', type: 'credit', amount: 167, description: 'Daily rent contribution', date: new Date(2026, 3, 20, 6, 2), reference: 'REF002', category: 'Rent' }
      ]
    }).pipe(delay(300));
  }
  
  getBankData(): Observable<any> {
    return of({
      linked: true,
      bankName: 'KCB Bank Kenya',
      accountName: 'Jane Akinyi Otieno',
      accountNumber: '1234567890',
      branchCode: 'KCBLKENX',
      swiftCode: 'KCBLKENX',
      verified: true
    }).pipe(delay(300));
  }
  
  refreshFinancialData(): Observable<any> {
    return of({ success: true }).pipe(delay(500));
  }
}
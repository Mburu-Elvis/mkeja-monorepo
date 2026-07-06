// services/ratiba.service.ts
import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject, of, throwError } from 'rxjs';
import { delay, catchError, tap } from 'rxjs/operators';
import { 
  RatibaData, 
  RatibaOrder, 
  DeductionRecord,
} from '../../models/financial.model';
import { PaymentPlanOption } from '../../models/ratiba.model';

@Injectable({
  providedIn: 'root'
})
export class RatibaService {
  private ratibaSubject = new BehaviorSubject<RatibaOrder | null>(null);
  public ratiba$ = this.ratibaSubject.asObservable();

  private dummyActiveRatiba: any = null;
  private deductionHistory: DeductionRecord[] = [];

  constructor() {
    this.initDummyData();
    this.dummyActiveRatiba = null;
  }

  private initDummyData(): void {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const twoDaysAgo = new Date(today);
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
    const threeDaysAgo = new Date(today);
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    const fourDaysAgo = new Date(today);
    fourDaysAgo.setDate(fourDaysAgo.getDate() - 4);
    const fiveDaysAgo = new Date(today);
    fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);

    this.deductionHistory = [
      {
        id: 'ded-001',
        date: today,
        amount: 167,
        status: 'SUCCESS',
        reference: 'SC8F2IQMH5',
        description: 'Daily rent contribution',
        errorCode: undefined
      },
      {
        id: 'ded-002',
        date: yesterday,
        amount: 167,
        status: 'SUCCESS',
        reference: 'HLJ7RT9KJ2',
        description: 'Daily rent contribution',
        errorCode: undefined
      },
      {
        id: 'ded-003',
        date: twoDaysAgo,
        amount: 167,
        status: 'FAILED',
        reference: '',
        description: 'Daily rent contribution - Insufficient funds',
        errorCode: 'INSUFFICIENT_FUNDS'
      },
      {
        id: 'ded-004',
        date: threeDaysAgo,
        amount: 167,
        status: 'SUCCESS',
        reference: 'MKJ8PL3WQ1',
        description: 'Daily rent contribution',
        errorCode: undefined
      },
      {
        id: 'ded-005',
        date: fourDaysAgo,
        amount: 167,
        status: 'SUCCESS',
        reference: 'PL9KJ2HGT5',
        description: 'Daily rent contribution',
        errorCode: undefined
      },
      {
        id: 'ded-006',
        date: fiveDaysAgo,
        amount: 167,
        status: 'SUCCESS',
        reference: 'QW8ER5TYU3',
        description: 'Daily rent contribution',
        errorCode: undefined
      }
    ];
  }

  /**
   * Get complete Ratiba data for the tenant
   */
  getRatibaData(): Observable<RatibaData> {
    const activeRatiba = this.dummyActiveRatiba;
    const recentDeductions = this.deductionHistory.slice(0, 10);
    const failedDeductions = this.deductionHistory.filter(d => d.status === 'FAILED');
    const totalDeducted = this.deductionHistory
      .filter(d => d.status === 'SUCCESS')
      .reduce((sum, d) => sum + d.amount, 0);

    const ratibaData: RatibaData = {
      active: activeRatiba ? this.mapToRatibaOrder(activeRatiba) : null,
      recentDeductions: recentDeductions,
      failedDeductions: failedDeductions,
      totalDeducted: totalDeducted,
      totalFailed: failedDeductions.length
    };

    return of(ratibaData).pipe(
      delay(500),
      catchError((error) => {
        console.error('getRatibaData error:', error);
        return of(this.getEmptyRatibaData());
      })
    );
  }

  /**
   * Refresh Ratiba data
   */
  refreshRatibaData(): Observable<RatibaData> {
    console.log('refreshRatibaData called');
    return this.getRatibaData().pipe(
      tap(() => console.log('Ratiba data refreshed'))
    );
  }

  /**
   * Get tenant's active Ratiba standing order
   */
  getActiveRatiba(tenantId: string): Observable<any> {
    console.log('getActiveRatiba called');
    return of(this.dummyActiveRatiba).pipe(
      delay(300),
      tap((ratiba) => {
        this.ratibaSubject.next(ratiba);
      }),
      catchError((error) => {
        console.error('getActiveRatiba error:', error);
        return of(null);
      })
    );
  }

  /**
   * Setup new Ratiba standing order
   */
  setupRatiba(
    tenantId: string,
    plan: string,
    amount: number,
    frequency: number
  ): Observable<any> {
    console.log('setupRatiba called', { tenantId, plan, amount, frequency });
    
    return of({
      responseHeader: {
        responseRefID: this.generateId(),
        responseCode: '200',
        responseDescription: 'Request accepted for processing',
        resultDesc: 'The service request is processed successfully.'
      },
      responseBody: {
        responseDescription: 'STK Push sent to customer phone',
        responseCode: '200'
      }
    }).pipe(
      delay(1500),
      tap(() => {
        setTimeout(() => {
          const startDate = new Date();
          const endDate = new Date();
          endDate.setFullYear(endDate.getFullYear() + 1);
          
          this.dummyActiveRatiba = {
            standingOrderId: this.generateId(),
            standingOrderName: `MKEJA_${plan}_${tenantId}_${Date.now()}`,
            tenantId: tenantId,
            walletId: `wallet_${tenantId}`,
            plan: plan,
            amount: amount,
            monthlyRent: 5000,
            frequency: frequency,
            startDate: startDate,
            endDate: endDate,
            status: 'ACTIVE',
            businessShortCode: '522533',
            accountReference: `W_${tenantId.substring(0, 8)}`,
            createdAt: new Date(),
            lastDeductionAt: new Date(),
            nextDeductionAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
          };
          
          console.log('Active Ratiba created:', this.dummyActiveRatiba);
          this.ratibaSubject.next(this.dummyActiveRatiba);
        }, 2000);
      }),
      catchError((error) => {
        console.error('setupRatiba error:', error);
        return throwError(() => new Error('Setup failed'));
      })
    );
  }

  /**
   * Cancel/delete Ratiba standing order
   */
  cancelRatiba(standingOrderId: string): Observable<{ success: boolean; message: string }> {
    console.log('cancelRatiba called for:', standingOrderId);
    
    return of({
      success: true,
      message: 'Ratiba cancelled successfully'
    }).pipe(
      delay(800),
      tap(() => {
        this.dummyActiveRatiba = null;
        this.ratibaSubject.next(null);
        console.log('Ratiba cancelled');
      }),
      catchError((error) => {
        console.error('cancelRatiba error:', error);
        return of({ success: false, message: 'Cancellation failed' });
      })
    );
  }

  /**
   * Get deduction history
   */
  getDeductionHistory(
    standingOrderId: string,
    page: number = 1,
    limit: number = 50
  ): Observable<{ deductions: DeductionRecord[]; total: number; page: number }> {
    console.log('getDeductionHistory called', { standingOrderId, page, limit });
    
    const start = (page - 1) * limit;
    const end = start + limit;
    const paginatedDeductions = this.deductionHistory.slice(start, end);
    
    return of({
      deductions: paginatedDeductions,
      total: this.deductionHistory.length,
      page: page
    }).pipe(
      delay(400),
      catchError((error) => {
        console.error('getDeductionHistory error:', error);
        return of({ deductions: [], total: 0, page: 1 });
      })
    );
  }

  /**
   * Retry failed deduction
   */
  retryDeduction(deductionId: string): Observable<{ success: boolean; message: string; transactionId?: string }> {
    console.log('retryDeduction called for:', deductionId);
    
    const deduction = this.deductionHistory.find(d => d.id === deductionId);
    
    if (!deduction) {
      return of({
        success: false,
        message: 'Deduction not found'
      }).pipe(delay(500));
    }
    
    return new Observable((observer) => {
      setTimeout(() => {
        deduction.status = 'SUCCESS';
        deduction.reference = `RETRY_${this.generateId()}`;
        deduction.errorCode = undefined;
        
        observer.next({
          success: true,
          message: 'Retry initiated successfully',
          transactionId: deduction.reference
        });
        observer.complete();
      }, 1000);
    });
  }

  /**
   * Get available payment plans
   */
  getPaymentPlans(monthlyRent: number): PaymentPlanOption[] {
    const dailyAmount = Math.ceil(monthlyRent / 30);
    const weeklyAmount = Math.ceil(monthlyRent / 4.33);
    
    return [
      {
        id: 'daily',
        name: 'Daily',
        value: 'DAILY',
        label: 'Daily',
        amount: dailyAmount,
        amountPerDeduction: dailyAmount,
        frequencyLabel: 'Every day at 6:00 AM',
        frequencyValue: 2,
        monthlyTotal: dailyAmount * 30,
        description: `KES ${dailyAmount.toLocaleString()} deducted automatically each morning`,
        features: [
          'Lowest per-payment amount',
          'Best for credit score building',
          'Automatic daily deductions at 6:00 AM',
          'Easier to maintain consistent payments'
        ],
        icon: 'today',
        recommended: true
      },
      {
        id: 'weekly',
        name: 'Weekly',
        value: 'WEEKLY',
        label: 'Weekly',
        amount: weeklyAmount,
        amountPerDeduction: weeklyAmount,
        frequencyLabel: 'Every Monday at 7:00 AM',
        frequencyValue: 3,
        monthlyTotal: weeklyAmount * 4,
        description: `KES ${weeklyAmount.toLocaleString()} deducted every Monday`,
        features: [
          'Moderate per-payment amount',
          'Deducted every Monday at 7:00 AM',
          '4-5 deductions per month',
          'Good balance of convenience'
        ],
        icon: 'date_range',
        recommended: false
      }
    ];
  }

  /**
   * Check if tenant can set up Ratiba
   */
  canSetupRatiba(kycStatus: string, hasActiveRatiba: boolean): { allowed: boolean; reason?: string } {
    if (kycStatus !== 'APPROVED') {
      return { allowed: false, reason: 'KYC verification required first' };
    }
    if (hasActiveRatiba) {
      return { allowed: false, reason: 'You already have an active standing order' };
    }
    return { allowed: true };
  }

  /**
   * Map standing order to RatibaOrder format
   */
  private mapToRatibaOrder(standingOrder: any): RatibaOrder {
    return {
      id: standingOrder.standingOrderId,
      planId: standingOrder.plan.toLowerCase(),
      planName: standingOrder.plan,
      amount: standingOrder.amount,
      frequency: standingOrder.frequency,
      startDate: standingOrder.startDate,
      endDate: standingOrder.endDate,
      nextDeduction: standingOrder.nextDeductionAt,
      lastDeduction: standingOrder.lastDeductionAt,
      status: standingOrder.status,
      totalDeducted: this.deductionHistory
        .filter(d => d.status === 'SUCCESS')
        .reduce((sum, d) => sum + d.amount, 0),
      remainingDeductions: Math.ceil((standingOrder.endDate.getTime() - new Date().getTime()) / (24 * 60 * 60 * 1000))
    };
  }

  /**
   * Get empty Ratiba data for error cases
   */
  private getEmptyRatibaData(): RatibaData {
    return {
      active: null,
      recentDeductions: [],
      failedDeductions: [],
      totalDeducted: 0,
      totalFailed: 0
    };
  }

  /**
   * Generate a unique ID
   */
  private generateId(): string {
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15);
  }

  /**
   * Reset all dummy data (for testing)
   */
  resetData(): void {
    this.dummyActiveRatiba = null;
    this.ratibaSubject.next(null);
    this.initDummyData();
  }
}
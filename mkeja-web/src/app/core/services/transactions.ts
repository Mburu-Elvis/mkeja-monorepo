// shared/services/transaction.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Observable, of, delay } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class TransactionService {
  private transactionsSubject = new BehaviorSubject<any[]>([]);
  public transactions$ = this.transactionsSubject.asObservable();
  
  constructor() {
    this.loadTransactions();
  }
  
  private loadTransactions(): void {
    const transactions = this.generateSampleTransactions();
    this.transactionsSubject.next(transactions);
  }
  
  private generateSampleTransactions(): any[] {
    const transactions = [];
    const now = new Date();
    
    for (let i = 0; i < 60; i++) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const isWeekend = date.getDay() === 0 || date.getDay() === 6;
      
      if (!isWeekend && i < 30) {
        transactions.push({
          id: `tx-${i}`,
          type: 'credit',
          amount: 167,
          description: 'Daily rent contribution (Auto-deduction)',
          date: new Date(date.getFullYear(), date.getMonth(), date.getDate(), 6, Math.floor(Math.random() * 10)),
          reference: `MPESA${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
          category: 'Rent',
          status: 'COMPLETED'
        });
      }
    }
    
    return transactions;
  }
  
  refreshTransactions(): Observable<any> {
    this.loadTransactions();
    return of({ success: true }).pipe(delay(500));
  }
}
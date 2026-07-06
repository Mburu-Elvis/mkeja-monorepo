import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TransactionItemComponent, Transaction } from '../../../../shared/components/transaction-item/transaction-item';
import { LoadingSpinnerComponent } from '../../../../shared/components/loading-spinner/loading-spinner';
import { PaymentService } from '../../../../core/services/payment';

@Component({
  selector: 'app-tenant-payments-history',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TransactionItemComponent,
    LoadingSpinnerComponent
  ],
  templateUrl: './history.html',
  styleUrls: ['./history.css']
})
export class TenantPaymentsHistoryComponent implements OnInit {
onBack() {
throw new Error('Method not implemented.');
}
  loading = true;
  transactions: Transaction[] = [];
  filteredTransactions: Transaction[] = [];
  filterType: 'all' | 'CREDIT' | 'DEBIT' = 'all';
  startDate: string = '';
  endDate: string = '';

  constructor(private paymentService: PaymentService) {}

  ngOnInit() {
    this.loadTransactions();
  }

  loadTransactions() {
    this.loading = true;
    // Simulate API call
    setTimeout(() => {
      this.transactions = [
        {
          id: '1',
          type: 'CREDIT',
          description: 'Daily rent contribution',
          amount: 167,
          date: new Date(2026, 2, 30, 6, 5),
          status: 'SUCCESS',
          reference: 'MPESA-001'
        },
        {
          id: '2',
          type: 'CREDIT',
          description: 'Daily rent contribution',
          amount: 167,
          date: new Date(2026, 2, 29, 6, 2),
          status: 'SUCCESS',
          reference: 'MPESA-002'
        },
        {
          id: '3',
          type: 'CREDIT',
          description: 'Daily rent contribution',
          amount: 167,
          date: new Date(2026, 2, 28, 6, 8),
          status: 'SUCCESS',
          reference: 'MPESA-003'
        },
        {
          id: '4',
          type: 'DEBIT',
          description: 'Rent Fuliza fee',
          amount: 64,
          date: new Date(2026, 2, 25, 10, 30),
          status: 'SUCCESS',
          reference: 'LOAN-FEE-001'
        },
        {
          id: '5',
          type: 'CREDIT',
          description: 'Rent Fuliza advance',
          amount: 1800,
          date: new Date(2026, 2, 25, 10, 25),
          status: 'SUCCESS',
          reference: 'LOAN-001'
        }
      ];
      this.applyFilter();
      this.loading = false;
    }, 1000);
  }

  applyFilter() {
    let filtered = [...this.transactions];
    
    if (this.filterType !== 'all') {
      filtered = filtered.filter(t => t.type === this.filterType);
    }
    
    if (this.startDate) {
      const start = new Date(this.startDate);
      filtered = filtered.filter(t => t.date >= start);
    }
    
    if (this.endDate) {
      const end = new Date(this.endDate);
      filtered = filtered.filter(t => t.date <= end);
    }
    
    this.filteredTransactions = filtered;
  }

  onFilterChange() {
    this.applyFilter();
  }

  clearFilters() {
    this.filterType = 'all';
    this.startDate = '';
    this.endDate = '';
    this.applyFilter();
  }
}
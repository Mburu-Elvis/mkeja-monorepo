import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LoadingSpinnerComponent } from '../../../../shared/components/loading-spinner/loading-spinner';

// Update the interface to include loanId:
interface LedgerEntry {
  id: string;
  type: string;
  direction: 'CREDIT' | 'DEBIT';
  amount: number;
  balanceAfter: number;
  description: string;
  mpesaRef?: string;
  loanId?: string;  // Add this line
  createdAt: Date;
}

@Component({
  selector: 'app-tenant-wallet-ledger',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    LoadingSpinnerComponent
  ],
  templateUrl: './ledger.html',
  styleUrls: ['./ledger.css']
})
export class TenantWalletLedgerComponent implements OnInit {
onBack() {
throw new Error('Method not implemented.');
}
  loading = true;
  entries: LedgerEntry[] = [];
  filteredEntries: LedgerEntry[] = [];
  filterType: 'all' | 'CREDIT' | 'DEBIT' = 'all';
  startDate = '';
  endDate = '';
  page = 1;
  total = 0;
  limit = 50;

  ngOnInit() {
    this.loadLedger();
  }

  loadLedger() {
    this.loading = true;
    setTimeout(() => {
      this.entries = [
        {
          id: '1',
          type: 'CONTRIBUTION',
          direction: 'CREDIT',
          amount: 167,
          balanceAfter: 3400,
          description: 'Daily rent contribution',
          mpesaRef: 'MPESA-001',
          createdAt: new Date(2026, 2, 30, 6, 5)
        },
        {
          id: '2',
          type: 'CONTRIBUTION',
          direction: 'CREDIT',
          amount: 167,
          balanceAfter: 3233,
          description: 'Daily rent contribution',
          mpesaRef: 'MPESA-002',
          createdAt: new Date(2026, 2, 29, 6, 2)
        },
        {
          id: '3',
          type: 'LOAN_FEE',
          direction: 'DEBIT',
          amount: 64,
          balanceAfter: 3066,
          description: 'Rent Fuliza fee',
          createdAt: new Date(2026, 2, 25, 10, 30)
        },
        {
          id: '4',
          type: 'LOAN_DRAW',
          direction: 'CREDIT',
          amount: 1800,
          balanceAfter: 3130,
          description: 'Rent Fuliza advance',
          loanId: 'LOAN-001',
          createdAt: new Date(2026, 2, 25, 10, 25)
        }
      ];
      this.applyFilters();
      this.loading = false;
    }, 1000);
  }

  applyFilters() {
    let filtered = [...this.entries];
    
    if (this.filterType !== 'all') {
      filtered = filtered.filter(e => e.direction === this.filterType);
    }
    
    if (this.startDate) {
      const start = new Date(this.startDate);
      filtered = filtered.filter(e => e.createdAt >= start);
    }
    
    if (this.endDate) {
      const end = new Date(this.endDate);
      filtered = filtered.filter(e => e.createdAt <= end);
    }
    
    this.filteredEntries = filtered;
    this.total = filtered.length;
  }

  getTypeIcon(type: string): string {
    switch(type) {
      case 'CONTRIBUTION': return 'payments';
      case 'LOAN_DRAW': return 'account_balance';
      case 'LOAN_FEE': return 'analytics';
      case 'RENT_SWEEP': return 'home';
      case 'SECURITY_DEPOSIT': return 'lock';
      default: return 'credit_card';
    }
  }

  getTypeLabel(type: string): string {
    switch(type) {
      case 'CONTRIBUTION': return 'Payment';
      case 'LOAN_DRAW': return 'Loan Disbursement';
      case 'LOAN_FEE': return 'Loan Fee';
      case 'RENT_SWEEP': return 'Rent Payment';
      case 'SECURITY_DEPOSIT': return 'Security Deposit';
      default: return 'Transaction';
    }
  }

  clearFilters() {
    this.filterType = 'all';
    this.startDate = '';
    this.endDate = '';
    this.applyFilters();
  }

  loadMore() {
    this.page++;
    this.loadLedger();
  }
}
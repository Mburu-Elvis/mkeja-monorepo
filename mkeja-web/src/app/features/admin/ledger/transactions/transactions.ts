import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LoadingSpinnerComponent } from '../../../../shared/components/loading-spinner/loading-spinner';

interface LedgerTransaction {
  id: string;
  timestamp: Date;
  type: string;
  amount: number;
  direction: 'CREDIT' | 'DEBIT';
  walletId: string;
  tenantName: string;
  reference: string;
  status: 'completed' | 'pending' | 'failed';
}

@Component({
  selector: 'app-admin-ledger-transactions',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    LoadingSpinnerComponent
  ],
  templateUrl: './transactions.html',
  styleUrls: ['./transactions.css']
})
export class AdminLedgerTransactionsComponent implements OnInit {
onBack() {
throw new Error('Method not implemented.');
}
  loading = true;
  transactions: LedgerTransaction[] = [];
  filteredTransactions: LedgerTransaction[] = [];
  searchTerm = '';
  filterType = 'all';
  startDate = '';
  endDate = '';
  page = 1;
  total = 0;

  ngOnInit() {
    this.loadTransactions();
  }

  loadTransactions() {
    this.loading = true;
    setTimeout(() => {
      this.transactions = [
        { id: '1', timestamp: new Date(2026, 2, 30, 6, 5), type: 'CONTRIBUTION', amount: 167, direction: 'CREDIT', walletId: 'w-001', tenantName: 'Jane Akinyi', reference: 'MPESA-001', status: 'completed' },
        { id: '2', timestamp: new Date(2026, 2, 30, 6, 2), type: 'CONTRIBUTION', amount: 167, direction: 'CREDIT', walletId: 'w-002', tenantName: 'Michael Kipchoge', reference: 'MPESA-002', status: 'completed' },
        { id: '3', timestamp: new Date(2026, 2, 29, 10, 30), type: 'LOAN_DRAW', amount: 1800, direction: 'CREDIT', walletId: 'w-001', tenantName: 'Jane Akinyi', reference: 'LOAN-001', status: 'completed' },
        { id: '4', timestamp: new Date(2026, 2, 29, 10, 30), type: 'LOAN_FEE', amount: 72, direction: 'DEBIT', walletId: 'w-001', tenantName: 'Jane Akinyi', reference: 'LOAN-001', status: 'completed' },
        { id: '5', timestamp: new Date(2026, 2, 28, 0, 1), type: 'RENT_SWEEP', amount: 5000, direction: 'DEBIT', walletId: 'w-001', tenantName: 'Jane Akinyi', reference: 'SWEEP-001', status: 'completed' }
      ];
      this.applyFilters();
      this.loading = false;
    }, 1000);
  }

  applyFilters() {
    let filtered = [...this.transactions];
    
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(t => 
        t.tenantName.toLowerCase().includes(term) || 
        t.reference.toLowerCase().includes(term) ||
        t.walletId.toLowerCase().includes(term)
      );
    }
    
    if (this.filterType !== 'all') {
      filtered = filtered.filter(t => t.type === this.filterType);
    }
    
    if (this.startDate) {
      const start = new Date(this.startDate);
      filtered = filtered.filter(t => t.timestamp >= start);
    }
    
    if (this.endDate) {
      const end = new Date(this.endDate);
      filtered = filtered.filter(t => t.timestamp <= end);
    }
    
    this.filteredTransactions = filtered;
    this.total = filtered.length;
  }

  getTypeLabel(type: string): string {
    const types: Record<string, string> = {
      'CONTRIBUTION': 'Contribution',
      'LOAN_DRAW': 'Loan Draw',
      'LOAN_FEE': 'Loan Fee',
      'RENT_SWEEP': 'Rent Sweep',
      'SECURITY_DEPOSIT': 'Security Deposit'
    };
    return types[type] || type;
  }

  getStatusClass(status: string): string {
    switch(status) {
      case 'completed': return 'success';
      case 'pending': return 'warning';
      case 'failed': return 'danger';
      default: return 'info';
    }
  }

  clearFilters() {
    this.searchTerm = '';
    this.filterType = 'all';
    this.startDate = '';
    this.endDate = '';
    this.applyFilters();
  }
}
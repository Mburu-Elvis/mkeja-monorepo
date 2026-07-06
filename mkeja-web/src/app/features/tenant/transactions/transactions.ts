// components/transactions/transactions.component.ts
import { Component, Input, Output, EventEmitter, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; // Add this import
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-transactions',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule,  // Add FormsModule here
    MatIconModule, 
    MatTooltipModule
  ],
  templateUrl: './transactions.html',
  styleUrls: ['./transactions.css']
})
export class TransactionsComponent implements OnInit {
  @Input() transactions: any[] = [];
  @Output() exportRequested = new EventEmitter<void>();
  
  private snackBar = inject(MatSnackBar);
  
  transactionFilter: 'all' | 'credit' | 'debit' = 'all';
  transactionDateRange: 'week' | 'month' | 'year' | 'all' = 'month';
  searchTerm: string = '';
  
  // Add Math to component for template access
  Math = Math;
  
  ngOnInit(): void {
    // Initialize
  }
  
  get filteredTransactions(): any[] {
    let filtered = [...(this.transactions || [])];
    
    // Apply type filter
    if (this.transactionFilter !== 'all') {
      filtered = filtered.filter(t => t.type === this.transactionFilter);
    }
    
    // Apply date range filter
    const now = new Date();
    if (this.transactionDateRange === 'week') {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      filtered = filtered.filter(t => new Date(t.date) >= weekAgo);
    } else if (this.transactionDateRange === 'month') {
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      filtered = filtered.filter(t => new Date(t.date) >= monthAgo);
    } else if (this.transactionDateRange === 'year') {
      const yearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
      filtered = filtered.filter(t => new Date(t.date) >= yearAgo);
    }
    
    // Apply search
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(t => 
        t.description?.toLowerCase().includes(term) ||
        t.reference?.toLowerCase().includes(term) ||
        t.category?.toLowerCase().includes(term)
      );
    }
    
    return filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }
  
  get totalInflow(): number {
    return (this.transactions || [])
      .filter(t => t.type === 'credit')
      .reduce((sum, t) => sum + (t.amount || 0), 0);
  }
  
  get totalOutflow(): number {
    return (this.transactions || [])
      .filter(t => t.type === 'debit')
      .reduce((sum, t) => sum + (t.amount || 0), 0);
  }
  
  get netFlow(): number {
    return this.totalInflow - this.totalOutflow;
  }
  
  exportTransactions(): void {
    this.exportRequested.emit();
    this.snackBar.open('Exporting transactions... Your file will download shortly.', 'Close', { duration: 3000 });
  }
  
  shareTransaction(transaction: any): void {
    this.snackBar.open(`Transaction receipt copied to clipboard: ${transaction.reference}`, 'Close', { duration: 3000 });
  }
  
  formatCurrency(amount: number): string {
    return `KES ${amount?.toLocaleString() || 0}`;
  }
  
  formatDate(date: Date | string): string {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-KE', { month: 'short', day: 'numeric', year: 'numeric' });
  }
  
  formatDateTime(date: Date | string): string {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-KE', { 
      month: 'short', 
      day: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  }
  
  getTransactionIcon(type: string): string {
    return type === 'credit' ? 'arrowUp' : 'arrowDown';
  }
  
  getStatusClass(status: string): string {
    switch (status) {
      case 'COMPLETED': return 'status-success';
      case 'PENDING': return 'status-warning';
      case 'FAILED': return 'status-danger';
      default: return '';
    }
  }
  
  clearFilters(): void {
    this.transactionFilter = 'all';
    this.transactionDateRange = 'month';
    this.searchTerm = '';
  }
}
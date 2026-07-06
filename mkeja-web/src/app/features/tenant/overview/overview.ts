// components/overview/overview.component.ts
import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar } from '@angular/material/snack-bar';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-overview',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatTooltipModule, RouterModule],
  templateUrl: './overview.html',
  styleUrls: ['./overview.css']
})
export class OverviewComponent {
  @Input() tenantData: any;
  @Input() propertyData: any;
  @Input() financialData: any;
  @Input() ratibaData: any;
  @Input() fulizaData: any;
  
  @Output() refreshData = new EventEmitter<void>();
  @Output() contactLandlord = new EventEmitter<void>();
  @Output() setActiveTab = new EventEmitter<string>();
  
  private snackBar = inject(MatSnackBar);
  
  balanceHidden = false;
  transactionFilter: 'all' | 'credit' | 'debit' = 'all';
  
  get currentMonthProgress(): number {
    return Math.min(100, (this.financialData?.paidToDate / this.financialData?.monthlyRent) * 100);
  }
  
  get daysUntilDue(): number {
    const today = new Date();
    const dueDate = this.financialData?.nextDueDate;
    if (!dueDate) return 0;
    const diffTime = new Date(dueDate).getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }
  
  get projectedCompletionDate(): Date {
    const dailyAmount = (this.financialData?.monthlyRent || 0) / 30;
    const remaining = (this.financialData?.monthlyRent || 0) - (this.financialData?.paidToDate || 0);
    const daysNeeded = Math.ceil(remaining / dailyAmount);
    const projectedDate = new Date();
    projectedDate.setDate(projectedDate.getDate() + daysNeeded);
    return projectedDate;
  }
  
  get creditScoreColor(): string {
    const score = this.fulizaData?.creditScore || 0;
    if (score >= 750) return '#2E7D32';
    if (score >= 650) return '#FF9800';
    return '#F44336';
  }
  
  get creditPercentage(): number {
    return ((this.fulizaData?.creditScore || 300) - 300) / 550 * 100;
  }
  
  get filteredTransactions(): any[] {
    if (!this.financialData?.recentTransactions) return [];
    let filtered = [...this.financialData.recentTransactions];
    if (this.transactionFilter !== 'all') {
      filtered = filtered.filter(t => t.type === this.transactionFilter);
    }
    return filtered.slice(0, 5);
  }
  
  toggleBalance(): void {
    this.balanceHidden = !this.balanceHidden;
  }
  
  addMoneyToWallet(): void {
    this.snackBar.open('STK Push sent to your phone. Enter PIN to complete payment.', 'Close', { duration: 3000 });
  }
  
  triggerManualPayment(): void {
    this.snackBar.open('STK Push sent to your phone. Enter PIN to complete payment.', 'Close', { duration: 3000 });
  }
  
  toggleAutoFuliza(): void {
    this.snackBar.open(`Auto-Fuliza ${!this.fulizaData?.autoTopUpEnabled ? 'enabled' : 'disabled'}`, 'Close', { duration: 3000 });
  }
  
  cancelRatiba(): void {
    const confirmed = confirm('Are you sure you want to cancel automatic deductions?');
    if (confirmed) {
      this.snackBar.open('Auto-deductions cancelled successfully', 'Close', { duration: 3000 });
    }
  }
  
  openSetupForm(): void {
    this.setActiveTab.emit('ratiba');
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
    return new Date(date).toLocaleDateString('en-KE', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  }
  
  calculateLoanRepaymentProgress(loan: any): number {
    if (!loan) return 0;
    return (loan.repaid / loan.totalRepayable) * 100;
  }
  
  getTierIcon(tier: string): string {
    switch (tier) {
      case 'BRONZE': return 'B';
      case 'SILVER': return 'S';
      case 'GOLD': return 'G';
      case 'PLATINUM': return 'P';
      default: return '—';
    }
  }
  
  getStatusColor(type: string): string {
    if (type === 'progress') {
      if (this.currentMonthProgress >= 100) return 'success';
      if (this.currentMonthProgress >= 80) return 'success';
      if (this.currentMonthProgress >= 40) return 'warning';
      return 'danger';
    }
    return 'warning';
  }
}
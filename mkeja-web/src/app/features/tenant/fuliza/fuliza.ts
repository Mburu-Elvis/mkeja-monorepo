// components/fuliza/fuliza.component.ts
import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-fuliza',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatIconModule],
  templateUrl: './fuliza.html',
  styleUrls: ['./fuliza.css']
})
export class FulizaComponent {
  @Input() fulizaData: any;
  @Input() financialData: any;
  @Output() dataChanged = new EventEmitter<void>();
  
  private snackBar = inject(MatSnackBar);
  private fb = inject(FormBuilder);
  
  showLoanDetails = false;
  showExtraPaymentModal = false; // Add this property
  selectedLoanForDetails: any = null;
  
  extraPaymentForm: FormGroup;
  
  constructor() {
    this.extraPaymentForm = this.fb.group({
      amount: ['', [Validators.required, Validators.min(100)]]
    });
  }
  
  // Add this method to open the extra payment modal
  openExtraPayment(): void {
    this.showExtraPaymentModal = true;
    this.extraPaymentForm.reset({ amount: '' });
  }
  
  // Add this method to close the extra payment modal
  closeExtraPayment(): void {
    this.showExtraPaymentModal = false;
    this.extraPaymentForm.reset({ amount: '' });
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
  
  get utilizedPercentage(): number {
    if (!this.fulizaData) return 0;
    return (this.fulizaData.utilizedAmount / this.fulizaData.totalLimit) * 100;
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
  
  getCreditTierDescription(tier: string): string {
    switch (tier) {
      case 'BRONZE': return 'Bronze tier members get up to 50% of monthly rent as credit';
      case 'SILVER': return 'Silver tier members get up to 75% of monthly rent as credit';
      case 'GOLD': return 'Gold tier members get up to 100% of monthly rent as credit';
      case 'PLATINUM': return 'Platinum tier members get up to 150% of monthly rent as credit';
      default: return '';
    }
  }
  
  calculateLoanRepaymentProgress(loan: any): number {
    if (!loan) return 0;
    return (loan.repaid / loan.totalRepayable) * 100;
  }
  
  getDailyRepaymentAmount(): number {
    if (!this.fulizaData?.activeLoan) return 0;
    return Math.ceil(this.fulizaData.activeLoan.totalRepayable / 30);
  }
  
  getRemainingDays(): number {
    if (!this.fulizaData?.activeLoan) return 0;
    const remaining = this.fulizaData.activeLoan.totalRepayable - this.fulizaData.activeLoan.repaid;
    const dailyAmount = this.getDailyRepaymentAmount();
    return Math.ceil(remaining / dailyAmount);
  }
  
  toggleAutoFuliza(): void {
    this.fulizaData.autoTopUpEnabled = !this.fulizaData.autoTopUpEnabled;
    this.snackBar.open(
      `Auto-Fuliza ${this.fulizaData.autoTopUpEnabled ? 'enabled' : 'disabled'}. ${this.fulizaData.autoTopUpEnabled ? 'We\'ll automatically cover rent shortfalls.' : 'You\'ll need to manually request loans.'}`,
      'Close',
      { duration: 4000 }
    );
    this.dataChanged.emit();
  }
  
  makeExtraLoanPayment(): void {
    const amount = this.extraPaymentForm.get('amount')?.value;
    
    if (!amount || amount < 100) {
      this.snackBar.open('Please enter a valid amount (minimum KES 100)', 'Close', { duration: 3000 });
      return;
    }
    
    if (amount > (this.fulizaData?.outstandingLoan || 0)) {
      this.snackBar.open(`Amount exceeds outstanding balance of KES ${this.fulizaData?.outstandingLoan}`, 'Close', { duration: 3000 });
      return;
    }
    
    this.snackBar.open(`STK Push sent for KES ${amount} towards loan repayment. Enter PIN to confirm.`, 'Close', { duration: 3000 });
    this.extraPaymentForm.reset({ amount: '' });
    this.closeExtraPayment(); // Close modal after successful submission
  }
  
  requestLoanManually(): void {
    this.snackBar.open('Loan request feature coming soon. Auto-Fuliza will cover shortfalls automatically.', 'Close', { duration: 4000 });
  }
  
  viewLoanDetails(loan: any): void {
    this.selectedLoanForDetails = loan;
    this.showLoanDetails = true;
  }
  
  closeLoanDetails(): void {
    this.showLoanDetails = false;
    this.selectedLoanForDetails = null;
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
}
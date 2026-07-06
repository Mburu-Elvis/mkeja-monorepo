import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { LoadingSpinnerComponent } from '../../../../shared/components/loading-spinner/loading-spinner';
import { ToastComponent } from '../../../../shared/components/toast/toast';
import { LoanService } from '../../../../core/services/loan';
import { WalletService } from '../../../../core/services/wallet';

@Component({
  selector: 'app-tenant-loan-request',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    LoadingSpinnerComponent,
    ToastComponent
  ],
  templateUrl: './request.html',
  styleUrls: ['./request.css']
})
export class TenantLoanRequestComponent implements OnInit {
onBack() {
throw new Error('Method not implemented.');
}
  loading = true;
  submitting = false;
  showToast = false;
  toastMessage = '';
  toastType: 'success' | 'error' | 'warning' | 'info' = 'info';
  
  monthlyRent = 5000;
  paidAmount = 3400;
  creditLimit = 3750;
  creditTier = 'Silver';
  creditScore = 620;
  
  requestedAmount = 0;
  feePercent = 4;
  fee = 0;
  totalRepayable = 0;
  
  constructor(
    private loanService: LoanService,
    private walletService: WalletService,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.loading = true;
    setTimeout(() => {
      const shortfall = this.monthlyRent - this.paidAmount;
      this.requestedAmount = Math.min(shortfall, this.creditLimit);
      this.calculateFee();
      this.loading = false;
    }, 1000);
  }

  calculateFee() {
    this.fee = Math.ceil(this.requestedAmount * (this.feePercent / 100));
    this.totalRepayable = this.requestedAmount + this.fee;
  }

  onAmountChange() {
    if (this.requestedAmount > this.creditLimit) {
      this.requestedAmount = this.creditLimit;
    }
    if (this.requestedAmount < 100) {
      this.requestedAmount = 100;
    }
    this.calculateFee();
  }

  getShortfall(): number {
    return this.monthlyRent - this.paidAmount;
  }

  requestLoan() {
    this.submitting = true;
    
    const loanRequest = {
      tenantId: 'tenant-123',
      walletId: 'wallet-123',
      requestedAmount: this.requestedAmount,
      purpose: 'RENT_SHORTFALL'
    };
    
    // Simulate API call
    setTimeout(() => {
      this.submitting = false;
      this.toastType = 'success';
      this.toastMessage = `Loan of KES ${this.requestedAmount.toLocaleString()} approved!`;
      this.showToast = true;
      
      setTimeout(() => {
        this.router.navigate(['/tenant/loan']);
      }, 2000);
    }, 2000);
  }

  closeToast() {
    this.showToast = false;
  }
}
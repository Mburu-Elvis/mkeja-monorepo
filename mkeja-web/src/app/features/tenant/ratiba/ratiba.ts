// components/ratiba/ratiba.component.ts
import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-ratiba',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatIconModule],
  templateUrl: './ratiba.html',
  styleUrls: ['./ratiba.css']
})
export class RatibaComponent implements OnInit, OnDestroy {
  @Input() ratibaData: any;
  @Input() financialData: any;
  @Input() tenantData: any;
  @Output() dataChanged = new EventEmitter<void>();
  
  private snackBar = inject(MatSnackBar);
  private fb = inject(FormBuilder);
  
  isSettingUp = false;
  isCancelling = false;
  isRetrying = false;
  showSetupForm = false;
  awaitingStkAuth = false;
  stkCountdown = 0;
  stkInterval: any;
  selectedPlan: any = null;
  
  setupForm!: FormGroup;
  
  ngOnInit(): void {
    this.setupForm = this.fb.group({
      plan: ['', Validators.required],
      agreeTerms: [false, Validators.requiredTrue],
      agreeAutoDebit: [false, Validators.requiredTrue]
    });
  }
  
  ngOnDestroy(): void {
    if (this.stkInterval) clearInterval(this.stkInterval);
  }
  
  get availablePlans(): any[] {
    const monthlyRent = this.financialData?.monthlyRent || 0;
    const dailyAmount = Math.ceil(monthlyRent / 30);
    const weeklyAmount = Math.ceil(monthlyRent / 4.33);
    
    return [
      {
        id: 'daily',
        name: 'Daily',
        amount: dailyAmount,
        frequencyLabel: 'Every day at 6:00 AM',
        description: 'Small daily deductions for better cash flow management',
        features: ['Lowest per-payment amount', 'Best for credit score building', 'Automatic daily deductions at 6:00 AM', 'Easier to maintain consistent payments'],
        recommended: true,
        icon: 'today'
      },
      {
        id: 'weekly',
        name: 'Weekly',
        amount: weeklyAmount,
        frequencyLabel: 'Every Monday at 7:00 AM',
        description: 'Weekly deductions - fewer transactions',
        features: ['Moderate per-payment amount', 'Deducted every Monday at 7:00 AM', '4-5 deductions per month', 'Good balance of convenience'],
        recommended: false,
        icon: 'date_range'
      }
    ];
  }
  
  selectPlan(plan: any): void {
    this.selectedPlan = plan;
    this.setupForm.patchValue({ plan: plan.id });
  }
  
  openSetupForm(): void {
    this.showSetupForm = true;
    this.selectedPlan = null;
    this.awaitingStkAuth = false;
    this.setupForm.reset({ plan: '', agreeTerms: false, agreeAutoDebit: false });
  }
  
  closeSetupForm(): void {
    this.showSetupForm = false;
    this.selectedPlan = null;
    this.awaitingStkAuth = false;
    if (this.stkInterval) clearInterval(this.stkInterval);
  }
  
  submitSetup(): void {
    if (this.setupForm.invalid || !this.selectedPlan) {
      let errorMsg = 'Please complete all required fields.';
      if (!this.selectedPlan) errorMsg = 'Please select a payment plan.';
      else if (!this.setupForm.get('agreeTerms')?.value) errorMsg = 'Please agree to the terms and conditions.';
      else if (!this.setupForm.get('agreeAutoDebit')?.value) errorMsg = 'Please authorize automatic deductions.';
      
      this.snackBar.open(errorMsg, 'Close', { duration: 3000 });
      return;
    }
    
    this.isSettingUp = true;
    
    setTimeout(() => {
      this.isSettingUp = false;
      this.awaitingStkAuth = true;
      this.startStkCountdown();
      
      this.snackBar.open('STK Push sent to your phone. Enter M-Pesa PIN to authorize standing order.', 'Close', { duration: 10000 });
      
      setTimeout(() => {
        if (this.awaitingStkAuth) {
          clearInterval(this.stkInterval);
          this.awaitingStkAuth = false;
          this.showSetupForm = false;
          
          // Simulate successful activation
          this.snackBar.open('Auto-deductions successfully activated!', 'Close', { duration: 5000 });
          this.dataChanged.emit();
        }
      }, 5000);
    }, 1500);
  }
  
  private startStkCountdown(): void {
    this.stkCountdown = 60;
    this.stkInterval = setInterval(() => {
      this.stkCountdown--;
      if (this.stkCountdown <= 0) {
        clearInterval(this.stkInterval);
        this.awaitingStkAuth = false;
        this.closeSetupForm();
        this.snackBar.open('STK Push timed out. Please try again.', 'Close', { duration: 5000 });
      }
    }, 1000);
  }
  
  cancelRatiba(): void {
    const confirmed = confirm('Are you sure you want to cancel automatic deductions? You will need to pay rent manually.');
    
    if (confirmed) {
      this.isCancelling = true;
      
      setTimeout(() => {
        this.isCancelling = false;
        this.snackBar.open('Auto-deductions cancelled successfully', 'Close', { duration: 3000 });
        this.dataChanged.emit();
      }, 800);
    }
  }
  
  retryFailedDeduction(deduction: any): void {
    this.isRetrying = true;
    
    setTimeout(() => {
      this.isRetrying = false;
      this.snackBar.open('Retry initiated. You will be notified when processed.', 'Close', { duration: 3000 });
      this.dataChanged.emit();
    }, 1000);
  }
  
  pauseRatiba(): void {
    this.snackBar.open('Pause feature coming soon. Contact support for assistance.', 'Close', { duration: 3000 });
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
  
  maskPhoneNumber(phone: string): string {
    if (!phone) return '';
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length >= 4) {
      const last4 = cleaned.slice(-4);
      return '*'.repeat(cleaned.length - 4) + last4;
    }
    return phone;
  }
}
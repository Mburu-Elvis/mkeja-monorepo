import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ToastComponent } from '../../../../shared/components/toast/toast';

@Component({
  selector: 'app-tenant-payments-topup',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ToastComponent
  ],
  templateUrl: './topup.html',
  styleUrls: ['./topup.css']
})
export class TenantPaymentsTopupComponent {
onBack() {
throw new Error('Method not implemented.');
}
  amount = 0;
  presetAmounts = [100, 200, 500, 1000, 2000, 5000];
  customAmount = '';
  processing = false;
  
  showToast = false;
  toastMessage = '';
  toastType: 'success' | 'error' | 'warning' | 'info' = 'info';

  constructor(private router: Router) {}

  selectAmount(amt: number) {
    this.amount = amt;
    this.customAmount = '';
  }

  onCustomAmountChange() {
    const numAmount = parseInt(this.customAmount);
    if (!isNaN(numAmount) && numAmount > 0) {
      this.amount = numAmount;
    }
  }

  onSubmit() {
    if (this.amount < 10) {
      this.showError('Minimum top-up amount is KES 10');
      return;
    }
    
    if (this.amount > 50000) {
      this.showError('Maximum top-up amount is KES 50,000');
      return;
    }

    this.processing = true;
    
    setTimeout(() => {
      this.processing = false;
      this.toastType = 'success';
      this.toastMessage = `STK Push sent to your phone. Enter M-Pesa PIN to complete payment of KES ${this.amount.toLocaleString()}.`;
      this.showToast = true;
      
      setTimeout(() => {
        this.router.navigate(['/tenant/wallet']);
      }, 3000);
    }, 1500);
  }

  showError(message: string) {
    this.toastType = 'error';
    this.toastMessage = message;
    this.showToast = true;
  }

  closeToast() {
    this.showToast = false;
  }
}
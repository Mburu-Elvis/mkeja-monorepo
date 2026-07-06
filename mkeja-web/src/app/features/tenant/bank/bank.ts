// components/bank/bank.component.ts
import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-bank',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    MatIconModule,
    MatTooltipModule
  ],
  templateUrl: './bank.html',  
  styleUrls: ['./bank.css']
})
export class BankComponent {
  @Input() bankData: any;
  @Output() dataChanged = new EventEmitter<void>();
  
  private snackBar = inject(MatSnackBar);
  
  showEditForm = false;
  editFormData: any = {};
  
  maskAccountNumber(accountNumber: string): string {
    if (!accountNumber) return '';
    const last4 = accountNumber.slice(-4);
    return '****' + last4;
  }
  
  maskSwiftCode(code: string): string {
    if (!code) return '';
    if (code.length <= 4) return code;
    return code.substring(0, 4) + '****';
  }
  
  copyToClipboard(text: string, label: string): void {
    navigator.clipboard.writeText(text).then(() => {
      this.snackBar.open(`${label} copied to clipboard!`, 'Close', { duration: 2000 });
    }).catch(() => {
      this.snackBar.open('Failed to copy', 'Close', { duration: 2000 });
    });
  }
  
  editBankDetails(): void {
    this.editFormData = { ...this.bankData };
    this.showEditForm = true;
  }
  
  closeEditForm(): void {
    this.showEditForm = false;
    this.editFormData = {};
  }
  
  saveBankDetails(): void {
    // Simulate API call
    setTimeout(() => {
      Object.assign(this.bankData, this.editFormData);
      this.showEditForm = false;
      this.snackBar.open('Bank details updated successfully', 'Close', { duration: 3000 });
      this.dataChanged.emit();
    }, 800);
  }
  
  verifyBankAccount(): void {
    this.snackBar.open('Verification initiated. A small deposit has been sent to your account. Enter the amount to verify.', 'Close', { duration: 5000 });
  }
  
  removeBankAccount(): void {
    const confirmed = confirm('Are you sure you want to remove your bank account? You will need to re-add it to receive refunds.');
    if (confirmed) {
      this.snackBar.open('Bank account removed successfully', 'Close', { duration: 3000 });
      // Implementation would call API
    }
  }
  
  formatCurrency(amount: number): string {
    return `KES ${amount?.toLocaleString() || 0}`;
  }
}
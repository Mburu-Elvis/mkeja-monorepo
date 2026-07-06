import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LoadingSpinnerComponent } from '../../../../shared/components/loading-spinner/loading-spinner';
import { ToastComponent } from '../../../../shared/components/toast/toast';

@Component({
  selector: 'app-admin-ledger-reconcile',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    LoadingSpinnerComponent,
    ToastComponent
  ],
  templateUrl: './reconcile.html',
  styleUrls: ['./reconcile.css']
})
export class AdminLedgerReconcileComponent implements OnInit {
onBack() {
throw new Error('Method not implemented.');
}
  loading = true;
  reconciling = false;
  selectedDate = new Date().toISOString().split('T')[0];
  
  mpesaTotal = 0;
  mkejaTotal = 0;
  difference = 0;
  discrepancies: any[] = [];
  
  showToast = false;
  toastMessage = '';
  toastType: 'success' | 'error' | 'warning' | 'info' = 'info';

  ngOnInit() {
    this.loadReconciliation();
  }

  loadReconciliation() {
    this.loading = true;
    setTimeout(() => {
      this.mpesaTotal = 125000;
      this.mkejaTotal = 124850;
      this.difference = this.mpesaTotal - this.mkejaTotal;
      
      this.discrepancies = [
        { ref: 'MPESA-001', amount: 167, status: 'missing_in_mkeja' },
        { ref: 'MPESA-002', amount: 500, status: 'amount_mismatch', expected: 500, actual: 450 }
      ];
      this.loading = false;
    }, 1000);
  }

  runReconciliation() {
    this.reconciling = true;
    setTimeout(() => {
      this.reconciling = false;
      this.toastType = 'success';
      this.toastMessage = 'Reconciliation completed successfully';
      this.showToast = true;
      this.loadReconciliation();
    }, 2000);
  }

  resolveDiscrepancy(discrepancy: any) {
    console.log('Resolving', discrepancy);
  }

  closeToast() {
    this.showToast = false;
  }
}
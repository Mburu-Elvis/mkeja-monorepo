import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { LoadingSpinnerComponent } from '../../../../shared/components/loading-spinner/loading-spinner';

interface Remittance {
  id: string;
  period: string;
  grossAmount: number;
  fee: number;
  netAmount: number;
  status: 'sent' | 'pending' | 'failed';
  sentDate: Date;
  bankReference?: string;
}

@Component({
  selector: 'app-landlord-remittances-history',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    LoadingSpinnerComponent
  ],
  templateUrl: './history.html',
  styleUrls: ['./history.css']
})
export class LandlordRemittancesHistoryComponent implements OnInit {
onBack() {
throw new Error('Method not implemented.');
}
  loading = true;
  remittances: Remittance[] = [];
  selectedYear = 2026;

  ngOnInit() {
    this.loadRemittances();
  }

  loadRemittances() {
    this.loading = true;
    setTimeout(() => {
      this.remittances = [
        {
          id: '1',
          period: 'March 2026',
          grossAmount: 75000,
          fee: 1875,
          netAmount: 73125,
          status: 'sent',
          sentDate: new Date(2026, 2, 6),
          bankReference: 'EFT-20260306-001'
        },
        {
          id: '2',
          period: 'February 2026',
          grossAmount: 72000,
          fee: 1800,
          netAmount: 70200,
          status: 'sent',
          sentDate: new Date(2026, 1, 6),
          bankReference: 'EFT-20260206-001'
        },
        {
          id: '3',
          period: 'January 2026',
          grossAmount: 68000,
          fee: 1700,
          netAmount: 66300,
          status: 'sent',
          sentDate: new Date(2026, 0, 6),
          bankReference: 'EFT-20260106-001'
        }
      ];
      this.loading = false;
    }, 1000);
  }

  getStatusClass(status: string): string {
    switch(status) {
      case 'sent': return 'success';
      case 'pending': return 'warning';
      case 'failed': return 'danger';
      default: return 'info';
    }
  }

  getStatusText(status: string): string {
    switch(status) {
      case 'sent': return 'Sent';
      case 'pending': return 'Pending';
      case 'failed': return 'Failed';
      default: return 'Unknown';
    }
  }

  downloadReceipt(remittance: Remittance) {
    // Implement PDF download
    console.log('Download receipt for', remittance.period);
  }
}
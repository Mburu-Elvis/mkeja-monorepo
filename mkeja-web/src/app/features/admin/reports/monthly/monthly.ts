import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LoadingSpinnerComponent } from '../../../../shared/components/loading-spinner/loading-spinner';

@Component({
  selector: 'app-admin-reports-monthly',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    LoadingSpinnerComponent
  ],
  templateUrl: './monthly.html',
  styleUrls: ['./monthly.css']
})
export class AdminReportsMonthlyComponent implements OnInit {
onBack() {
throw new Error('Method not implemented.');
}
  loading = true;
  selectedYear = 2026;
  selectedMonth = 2; // March (0-indexed)
  report: any = null;
  
  months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  ngOnInit() {
    this.loadReport();
  }

  loadReport() {
    this.loading = true;
    setTimeout(() => {
      this.report = {
        year: this.selectedYear,
        month: this.months[this.selectedMonth],
        totalContributions: 37440,
        totalAmount: 6252480,
        uniquePayers: 2847,
        loanDisbursements: 1350,
        loanAmount: 2430000,
        loanFees: 97200,
        rentSweeps: 33600,
        sweepAmount: 168000000,
        mkejaFees: 4200000,
        newTenants: 423,
        newLandlords: 28,
        activeTenants: 8234,
        activeLandlords: 156,
        loanDefaultRate: 2.4,
        recoveryRate: 78.5
      };
      this.loading = false;
    }, 1000);
  }

  previousMonth() {
    if (this.selectedMonth === 0) {
      this.selectedMonth = 11;
      this.selectedYear--;
    } else {
      this.selectedMonth--;
    }
    this.loadReport();
  }

  nextMonth() {
    if (this.selectedMonth === 11) {
      this.selectedMonth = 0;
      this.selectedYear++;
    } else {
      this.selectedMonth++;
    }
    this.loadReport();
  }

  downloadCSV() {
    console.log('Downloading monthly report');
  }
}
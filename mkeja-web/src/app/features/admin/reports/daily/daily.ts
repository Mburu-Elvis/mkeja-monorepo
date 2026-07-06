import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LoadingSpinnerComponent } from '../../../../shared/components/loading-spinner/loading-spinner';

@Component({
  selector: 'app-admin-reports-daily',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    LoadingSpinnerComponent
  ],
  templateUrl: './daily.html',
  styleUrls: ['./daily.css']
})
export class AdminReportsDailyComponent implements OnInit {
onBack() {
throw new Error('Method not implemented.');
}
  loading = true;
  selectedDate = new Date().toISOString().split('T')[0];
  report: any = null;

  ngOnInit() {
    this.loadReport();
  }

  loadReport() {
    this.loading = true;
    setTimeout(() => {
      this.report = {
        date: this.selectedDate,
        totalContributions: 1248,
        totalAmount: 208416,
        uniquePayers: 1124,
        averageContribution: 167,
        loanDisbursements: 45,
        loanAmount: 81000,
        loanFees: 3240,
        rentSweeps: 1120,
        sweepAmount: 5600000,
        mkejaFees: 140000,
        topUps: 89,
        topUpAmount: 44500
      };
      this.loading = false;
    }, 1000);
  }

  downloadCSV() {
    console.log('Downloading CSV for', this.selectedDate);
  }
}
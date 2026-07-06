import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { LoadingSpinnerComponent } from '../../../../shared/components/loading-spinner/loading-spinner';
import { LoanService } from '../../../../core/services/loan';

@Component({
  selector: 'app-tenant-loan-main',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    LoadingSpinnerComponent
  ],
  templateUrl: './main.html',
  styleUrls: ['./main.css']
})
export class TenantLoanMainComponent implements OnInit {
onBack() {
throw new Error('Method not implemented.');
}
  loading = true;
  creditScore = 620;
  creditTier = 'Silver';
  creditLimit = 3750;
  monthlyRent = 5000;
  activeLoan: any = null;
  
  ngOnInit() {
    this.loadLoanData();
  }
  
  loadLoanData() {
    this.loading = true;
    setTimeout(() => {
      this.activeLoan = null; // Set to null for demo, or populate with active loan
      this.loading = false;
    }, 1000);
  }
  
  getScorePercentage(): number {
    return ((this.creditScore - 300) / 550) * 100;
  }
  
  getNextTier(): string {
    if (this.creditScore < 650) return 'Gold (650+)';
    if (this.creditScore < 750) return 'Platinum (750+)';
    return 'Maximum Tier';
  }
  
  getPointsNeeded(): number {
    if (this.creditScore < 650) return 650 - this.creditScore;
    if (this.creditScore < 750) return 750 - this.creditScore;
    return 0;
  }
}
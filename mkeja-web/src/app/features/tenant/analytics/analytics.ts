// components/analytics/analytics.component.ts
import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'app-analytics',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatTooltipModule],
  templateUrl: './analytics.html',
  styleUrls: ['./analytics.css']
})
export class AnalyticsComponent implements OnInit {
  @Input() financialData: any;
  @Input() fulizaData: any;
  @Input() transactions: any[] = [];
  Math = Math;

  analyticsPeriod: 'week' | 'month' | 'quarter' | 'year' = 'month';
  currentMonth: string = '';

  // Chart data
  dailyContributions: number[] = [];
  creditScoreHistory: { month: string; score: number }[] = [];
  spendingBreakdown: any = {};

  ngOnInit(): void {
    this.currentMonth = new Date().toLocaleDateString('en-KE', { month: 'long', year: 'numeric' });
    this.generateChartData();
  }

  generateChartData(): void {
    // Generate daily contributions for the current month
    const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
    this.dailyContributions = [];

    for (let i = 1; i <= Math.min(daysInMonth, 30); i++) {
      // Simulate higher contributions on Mondays and paydays
      let contribution = 0;
      if (i <= 21) {
        contribution = Math.floor(Math.random() * 200) + 50;
        if (i % 7 === 1) contribution += 100; // Higher on Mondays
        if (i === 5 || i === 20) contribution += 300; // Paydays
      }
      this.dailyContributions.push(contribution);
    }

    // Generate credit score history
    this.creditScoreHistory = [
      { month: 'Nov', score: 450 },
      { month: 'Dec', score: 520 },
      { month: 'Jan', score: 580 },
      { month: 'Feb', score: 650 },
      { month: 'Mar', score: 672 }
    ];

    // Calculate spending breakdown
    const transactions = this.transactions || [];
    const rentTotal = transactions
      .filter(t => t.category === 'Rent' && t.type === 'debit')
      .reduce((sum, t) => sum + t.amount, 0);

    const fulizaTotal = transactions
      .filter(t => t.category === 'Loan' || t.category === 'Fee')
      .reduce((sum, t) => sum + t.amount, 0);

    const otherTotal = transactions
      .filter(t => t.type === 'debit' && t.category !== 'Rent' && t.category !== 'Loan' && t.category !== 'Fee')
      .reduce((sum, t) => sum + t.amount, 0);

    const total = rentTotal + fulizaTotal + otherTotal;

    this.spendingBreakdown = {
      rent: total > 0 ? (rentTotal / total) * 100 : 70,
      fuliza: total > 0 ? (fulizaTotal / total) * 100 : 15,
      other: total > 0 ? (otherTotal / total) * 100 : 15
    };
  }

  getInsights(): string[] {
    const insights = [];

    if (this.financialData?.paymentStats?.consistencyScore >= 85) {
      insights.push('Your payment consistency is in the top 15% of all Mkeja users');
    }

    if (this.fulizaData?.creditTier === 'SILVER') {
      insights.push('Continue daily payments to reach Gold tier in 3 months');
    }

    if (this.financialData?.paymentPlan !== 'MONTHLY') {
      insights.push(`You've saved an estimated KES 1,200 in late fees by using ${this.financialData?.paymentPlan?.toLowerCase()} auto-deductions`);
    }

    if (insights.length === 0) {
      insights.push('Set up auto-deductions to start building your credit history');
      insights.push('Make 5 more on-time payments to reach Silver tier');
    }

    return insights;
  }

  getMaxContribution(): number {
    return Math.max(...this.dailyContributions, 500);
  }

  getBarHeight(contribution: number): number {
    const max = this.getMaxContribution();
    return max > 0 ? (contribution / max) * 100 : 0;
  }

  formatCurrency(amount: number): string {
    return `KES ${amount?.toLocaleString() || 0}`;
  }

  getProjectedTier(): string {
    const currentTier = this.fulizaData?.creditTier || 'BRONZE';
    if (currentTier === 'BRONZE') return 'Silver';
    if (currentTier === 'SILVER') return 'Gold';
    if (currentTier === 'GOLD') return 'Platinum';
    return 'Platinum';
  }

  getProjectedTimeline(): string {
    const currentTier = this.fulizaData?.creditTier || 'BRONZE';
    if (currentTier === 'BRONZE') return '2-3 months';
    if (currentTier === 'SILVER') return '3-4 months';
    if (currentTier === 'GOLD') return '6 months';
    return 'You\'re already at the highest tier';
  }
}
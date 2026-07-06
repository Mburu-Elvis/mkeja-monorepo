import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { LoadingSpinnerComponent } from '../../../../shared/components/loading-spinner/loading-spinner';

interface UnitStatement {
  unitRef: string;
  tenantName: string;
  monthlyRent: number;
  paidAmount: number;
  status: string;
}

@Component({
  selector: 'app-landlord-remittances-statement',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    LoadingSpinnerComponent
  ],
  templateUrl: './statement.html',
  styleUrls: ['./statement.css']
})
export class LandlordRemittancesStatementComponent implements OnInit {
onBack() {
throw new Error('Method not implemented.');
}
  loading = true;
  period = '';
  statement: any = null;
  units: UnitStatement[] = [];

  constructor(private route: ActivatedRoute) {}

  ngOnInit() {
    this.period = this.route.snapshot.queryParams['period'] || '2026-03';
    this.loadStatement();
  }

  loadStatement() {
    this.loading = true;
    setTimeout(() => {
      this.statement = {
        period: 'March 2026',
        grossRent: 75000,
        mkejaFees: 1875,
        netRemittance: 73125,
        remittanceDate: new Date(2026, 2, 6),
        bankReference: 'EFT-20260306-001'
      };
      
      this.units = [
        { unitRef: 'A1', tenantName: 'Jane Akinyi', monthlyRent: 5000, paidAmount: 5000, status: 'paid' },
        { unitRef: 'A2', tenantName: 'Michael Kipchoge', monthlyRent: 5000, paidAmount: 5000, status: 'paid' },
        { unitRef: 'A3', tenantName: 'Vacant', monthlyRent: 5000, paidAmount: 0, status: 'vacant' },
        { unitRef: 'B1', tenantName: 'Sarah Wanjiku', monthlyRent: 4500, paidAmount: 4500, status: 'paid' },
        { unitRef: 'B2', tenantName: 'Peter Mwangi', monthlyRent: 4500, paidAmount: 4500, status: 'paid' }
      ];
      this.loading = false;
    }, 1000);
  }

  downloadPDF() {
    // Implement PDF download
    console.log('Downloading PDF statement for', this.period);
  }
}
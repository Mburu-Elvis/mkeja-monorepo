import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { LandlordService, TenancyHistoryItem, UnitHistory } from '../../../../core/services/landlord.service';
import { DEMO_TENANCY_LABEL, demoUnitTenancyHistory } from '../../../../shared/data/demo-tenancy-history';

@Component({
  selector: 'app-landlord-unit-details',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './details.html',
  styleUrls: ['./details.css']
})
export class LandlordUnitDetailsComponent implements OnInit {
  loading = true;
  error = '';
  unitId = 0;
  unit: UnitHistory | null = null;
  tenancies: TenancyHistoryItem[] = [];
  usingDemoData = false;
  readonly demoLabel = DEMO_TENANCY_LABEL;

  constructor(
    private route: ActivatedRoute,
    private landlordService: LandlordService
  ) {}

  ngOnInit(): void {
    this.unitId = Number(this.route.snapshot.params['id']);
    this.loadUnit();
  }

  loadUnit(): void {
    this.loading = true;
    this.error = '';
    this.landlordService.getUnitHistory(this.unitId).subscribe({
      next: (data) => {
        this.unit = data;
        if (data.tenancies.length === 0) {
          this.tenancies = demoUnitTenancyHistory();
          this.usingDemoData = true;
        } else {
          this.tenancies = data.tenancies;
          this.usingDemoData = false;
        }
        this.loading = false;
      },
      error: (err) => {
        this.error = err.message || 'Failed to load unit history';
        this.tenancies = demoUnitTenancyHistory();
        this.usingDemoData = true;
        this.loading = false;
      }
    });
  }

  locationLabel(): string {
    if (!this.unit) return '';
    const parts: string[] = [];
    if (this.unit.wing) parts.push(this.unit.wing);
    if (this.unit.floorNumber != null) parts.push(`Floor ${this.unit.floorNumber}`);
    return parts.length ? parts.join(' · ') : '—';
  }

  statusClass(status: string): string {
    switch ((status || '').toUpperCase()) {
      case 'ACTIVE': return 'active';
      case 'TERMINATED':
      case 'EXPIRED': return 'ended';
      case 'PENDING': return 'pending';
      default: return 'info';
    }
  }

  formatDate(value?: string): string {
    if (!value) return '—';
    return new Date(value).toLocaleDateString('en-KE', { year: 'numeric', month: 'short', day: 'numeric' });
  }

  isVacantUnit(): boolean {
    return (this.unit?.status || '').toUpperCase() === 'VACANT';
  }
}

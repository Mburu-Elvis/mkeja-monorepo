import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { LoadingSpinnerComponent } from '../../../../shared/components/loading-spinner/loading-spinner';
import { LandlordService, LandlordTenantSummary } from '../../../../core/services/landlord.service';

@Component({
  selector: 'app-landlord-tenants-details',
  standalone: true,
  imports: [CommonModule, RouterModule, LoadingSpinnerComponent],
  templateUrl: './details.html',
  styleUrls: ['./details.css']
})
export class LandlordTenantsDetailsComponent implements OnInit {
  loading = true;
  error = '';
  tenantId = 0;
  tenant: LandlordTenantSummary | null = null;

  constructor(
    private route: ActivatedRoute,
    private landlordService: LandlordService
  ) {}

  ngOnInit(): void {
    this.tenantId = Number(this.route.snapshot.params['id']);
    this.loadTenantDetails();
  }

  loadTenantDetails(): void {
    this.loading = true;
    this.landlordService.getTenant(this.tenantId).subscribe({
      next: (data) => {
        this.tenant = data;
        this.loading = false;
      },
      error: (err) => {
        this.error = err.message || 'Failed to load tenant';
        this.loading = false;
      }
    });
  }

  locationLabel(): string {
    if (!this.tenant) return '';
    const parts: string[] = [];
    if (this.tenant.wing) parts.push(this.tenant.wing);
    if (this.tenant.floorNumber != null) parts.push(`Floor ${this.tenant.floorNumber}`);
    return parts.length ? parts.join(' · ') : '';
  }

  getKycBadgeClass(status: string): string {
    const s = (status || '').toLowerCase();
    if (s === 'approved' || s === 'verified') return 'success';
    if (s === 'pending' || s === 'manual_review') return 'warning';
    if (s === 'rejected') return 'danger';
    return 'info';
  }

  getStatusBadgeClass(status: string): string {
    const s = (status || '').toLowerCase();
    if (s === 'active') return 'success';
    return 'info';
  }
}

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AdminService, AdminPropertyDetail } from '../../../../core/services/admin.service';
import { UnitSummary } from '../../../../core/services/property.service';

@Component({
  selector: 'app-admin-properties-details',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './details.html',
  styleUrls: ['./details.css']
})
export class AdminPropertiesDetailsComponent implements OnInit {
  loading = true;
  error = '';
  propertyId = 0;
  detail: AdminPropertyDetail | null = null;
  acting = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private adminService: AdminService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.propertyId = Number(this.route.snapshot.params['id']);
    this.load();
  }

  load(): void {
    this.loading = true;
    this.error = '';
    this.adminService.getPropertyDetail(this.propertyId).subscribe({
      next: (detail) => {
        this.detail = detail;
        this.loading = false;
      },
      error: (err: Error) => {
        this.error = err.message;
        this.loading = false;
      }
    });
  }

  onBack(): void {
    this.router.navigate(['/admin/properties']);
  }

  verifyProperty(): void {
    if (!this.detail || this.acting) return;
    this.acting = true;
    this.adminService.verifyProperty(this.propertyId).subscribe({
      next: () => {
        this.acting = false;
        this.snackBar.open('Property verified.', 'Close', { duration: 3500 });
        this.load();
      },
      error: (err: Error) => {
        this.error = err.message;
        this.acting = false;
      }
    });
  }

  rejectProperty(): void {
    if (!this.detail || this.acting) return;
    if (!confirm('Reject this property? It will be hidden from House Hunt.')) return;
    this.acting = true;
    this.adminService.rejectProperty(this.propertyId).subscribe({
      next: () => {
        this.acting = false;
        this.snackBar.open('Property rejected.', 'Close', { duration: 3500 });
        this.load();
      },
      error: (err: Error) => {
        this.error = err.message;
        this.acting = false;
      }
    });
  }

  deleteProperty(): void {
    if (!this.detail || this.acting) return;
    const name = this.detail.property.name;
    if (!confirm(`Delete ${name}? This removes units, photos, tenancies, and invitations.`)) return;
    this.acting = true;
    this.adminService.deleteProperty(this.propertyId).subscribe({
      next: () => {
        this.acting = false;
        this.snackBar.open(`${name} deleted.`, 'Close', { duration: 3500 });
        this.router.navigate(['/admin/properties']);
      },
      error: (err: Error) => {
        this.error = err.message;
        this.acting = false;
      }
    });
  }

  unitStatusClass(status?: string): string {
    switch ((status || '').toUpperCase()) {
      case 'VACANT': return 'success';
      case 'OCCUPIED': return 'warning';
      case 'MAINTENANCE': return 'danger';
      default: return 'neutral';
    }
  }

  trackUnit(_index: number, unit: UnitSummary): number {
    return unit.id;
  }
}

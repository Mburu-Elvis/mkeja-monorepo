import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AdminService, AdminInvitationItem } from '../../../../core/services/admin.service';

@Component({
  selector: 'app-admin-invitations-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './list.html',
  styleUrls: ['./list.css']
})
export class AdminInvitationsListComponent implements OnInit {
  loading = true;
  error = '';
  invitations: AdminInvitationItem[] = [];
  searchTerm = '';
  filterStatus = 'all';
  actingId: number | null = null;

  constructor(
    private adminService: AdminService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.error = '';
    this.adminService.listInvitations({
      status: this.filterStatus !== 'all' ? this.filterStatus : undefined,
      search: this.searchTerm.trim() || undefined
    }).subscribe({
      next: (items) => {
        this.invitations = items;
        this.loading = false;
      },
      error: (err: Error) => {
        this.error = err.message;
        this.loading = false;
      }
    });
  }

  get hasActiveFilters(): boolean {
    return !!this.searchTerm.trim() || this.filterStatus !== 'all';
  }

  resetFilters(): void {
    this.searchTerm = '';
    this.filterStatus = 'all';
    this.load();
  }

  cancel(invitation: AdminInvitationItem): void {
    if (!confirm(`Cancel invitation for ${invitation.tenantName} on unit ${invitation.unitNumber}?`)) return;
    if (this.actingId !== null) return;
    this.actingId = invitation.id;
    this.adminService.cancelInvitation(invitation.id).subscribe({
      next: (updated) => {
        this.invitations = this.invitations.map(i => i.id === invitation.id ? updated : i);
        this.actingId = null;
        this.snackBar.open('Invitation cancelled.', 'Close', { duration: 3500 });
      },
      error: (err: Error) => {
        this.error = err.message;
        this.actingId = null;
      }
    });
  }

  statusClass(status?: string): string {
    switch ((status || '').toUpperCase()) {
      case 'PENDING': return 'warning';
      case 'VIEWED': return 'neutral';
      case 'ACCEPTED': return 'success';
      case 'CANCELLED': return 'danger';
      case 'EXPIRED': return 'danger';
      default: return 'neutral';
    }
  }

  canCancel(status?: string): boolean {
    const value = (status || '').toUpperCase();
    return value === 'PENDING' || value === 'VIEWED';
  }
}

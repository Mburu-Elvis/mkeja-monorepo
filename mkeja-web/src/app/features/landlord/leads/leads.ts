import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { DiscoveryService, ListingInterest } from '../../../core/services/discovery.service';

type LeadFilter = 'all' | 'NEW' | 'CONTACTED';

@Component({
  selector: 'app-landlord-leads',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './leads.html',
  styleUrls: ['./leads.css']
})
export class LandlordLeadsComponent implements OnInit {
  loading = true;
  leads: ListingInterest[] = [];
  error = '';
  pendingInviteLead: ListingInterest | null = null;
  statusFilter: LeadFilter = 'all';
  searchTerm = '';
  actingLeadId: number | null = null;

  constructor(private discoveryService: DiscoveryService) {}

  ngOnInit(): void {
    this.loadLeads();
  }

  loadLeads(): void {
    this.loading = true;
    this.error = '';
    this.discoveryService.listLandlordLeads().subscribe({
      next: (leads) => {
        this.leads = leads;
        this.loading = false;
      },
      error: (err) => {
        this.error = err.message || 'Failed to load leads';
        this.loading = false;
      }
    });
  }

  get filteredLeads(): ListingInterest[] {
    const term = this.searchTerm.trim().toLowerCase();
    return this.leads.filter((lead) => {
      const matchesStatus = this.statusFilter === 'all' || lead.status === this.statusFilter;
      if (!matchesStatus) return false;
      if (!term) return true;
      return (
        lead.tenantName.toLowerCase().includes(term) ||
        lead.tenantPhone.includes(term) ||
        (lead.propertyName || '').toLowerCase().includes(term) ||
        (lead.unitLabel || '').toLowerCase().includes(term)
      );
    });
  }

  get newLeadCount(): number {
    return this.leads.filter((l) => l.status === 'NEW').length;
  }

  get contactedCount(): number {
    return this.leads.filter((l) => l.status === 'CONTACTED').length;
  }

  markContacted(lead: ListingInterest): void {
    if (lead.status === 'CONTACTED' || this.actingLeadId === lead.id) return;
    this.actingLeadId = lead.id;
    this.discoveryService.markLeadContacted(lead.id).subscribe({
      next: (updated) => {
        lead.status = updated.status;
        this.actingLeadId = null;
      },
      error: () => {
        this.actingLeadId = null;
      }
    });
  }

  inviteTenant(lead: ListingInterest): void {
    this.pendingInviteLead = lead;
  }

  confirmInvite(): void {
    const lead = this.pendingInviteLead;
    if (!lead) return;
    this.pendingInviteLead = null;
    window.location.href = `/landlord/tenants/invite?phone=${encodeURIComponent(lead.tenantPhone)}&name=${encodeURIComponent(lead.tenantName)}&unitId=${lead.unitId}&propertyId=${lead.propertyId}&fromLead=1`;
  }

  cancelInvite(): void {
    this.pendingInviteLead = null;
  }

  tenantInitials(name: string): string {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return '?';
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  }

  formatPhone(phone: string): string {
    if (!phone) return '';
    return phone.startsWith('+') ? phone : `+${phone}`;
  }

  formatDate(value?: string): string {
    if (!value) return 'Recently';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'Recently';
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  }

  statusLabel(status: string): string {
    switch (status) {
      case 'NEW': return 'New';
      case 'CONTACTED': return 'Contacted';
      case 'DECLINED': return 'Declined';
      default: return status;
    }
  }

  statusClass(status: string): string {
    switch (status) {
      case 'NEW': return 'status-new';
      case 'CONTACTED': return 'status-contacted';
      case 'DECLINED': return 'status-declined';
      default: return 'status-default';
    }
  }
}

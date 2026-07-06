import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { DiscoveryService, PropertyDiscoveryListing } from '../../../../core/services/discovery.service';
import { TenantService } from '../../../../core/services/tenant';
import { TenantInvitationSummary } from '../../../../models/onboarding.model';

@Component({
  selector: 'app-house-hunt-main',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './main.html',
  styleUrls: ['./main.css']
})
export class HouseHuntMainComponent implements OnInit {
  loading = true;
  listings: PropertyDiscoveryListing[] = [];
  pendingInvitations: TenantInvitationSummary[] = [];
  error = '';

  q = '';
  county = '';
  city = '';
  minRent: number | null = null;
  maxRent: number | null = null;
  minBedrooms: number | null = null;

  constructor(
    private discoveryService: DiscoveryService,
    private tenantService: TenantService
  ) {}

  ngOnInit(): void {
    this.loadInvitations();
    this.search();
  }

  loadInvitations(): void {
    this.tenantService.listMyInvitations().subscribe({
      next: (invites) => { this.pendingInvitations = invites; },
      error: () => { this.pendingInvitations = []; }
    });
  }

  search(): void {
    this.loading = true;
    this.error = '';
    this.discoveryService.searchProperties({
      q: this.q || undefined,
      county: this.county || undefined,
      city: this.city || undefined,
      minRent: this.minRent ?? undefined,
      maxRent: this.maxRent ?? undefined,
      minBedrooms: this.minBedrooms ?? undefined
    }).subscribe({
      next: (listings) => {
        this.listings = listings;
        this.loading = false;
      },
      error: (err: Error) => {
        this.error = err.message || 'Unable to load listings';
        this.loading = false;
      }
    });
  }

  clearFilters(): void {
    this.q = '';
    this.county = '';
    this.city = '';
    this.minRent = null;
    this.maxRent = null;
    this.minBedrooms = null;
    this.search();
  }

  locationLabel(item: PropertyDiscoveryListing): string {
    const parts = [item.address, item.city, item.county].filter(Boolean);
    return parts.length ? parts.join(' · ') : 'Kenya';
  }

  inviteLink(invite: TenantInvitationSummary): string {
    return invite.invitationUrl || `/tenant/onboarding/invitation/${invite.code}`;
  }
}

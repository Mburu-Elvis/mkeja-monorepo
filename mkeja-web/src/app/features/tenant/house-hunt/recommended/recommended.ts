import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { DiscoveryService, PropertyDiscoveryListing } from '../../../../core/services/discovery.service';

@Component({
  selector: 'app-house-hunt-recommended',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './recommended.html',
  styleUrls: ['./recommended.css']
})
export class HouseHuntRecommendedComponent implements OnInit {
  loading = true;
  listings: PropertyDiscoveryListing[] = [];
  error = '';

  constructor(private discoveryService: DiscoveryService) {}

  ngOnInit(): void {
    this.discoveryService.getRecommendations().subscribe({
      next: (listings) => {
        this.listings = listings;
        this.loading = false;
      },
      error: (err: Error) => {
        this.error = err.message || 'Unable to load recommendations';
        this.loading = false;
      }
    });
  }

  unitTypeSummary(item: PropertyDiscoveryListing): string {
    if (!item.unitTypes?.length) return `${item.availableUnits} units available`;
    return item.unitTypes.map((t) => `${t.availableCount} ${t.label}${t.availableCount === 1 ? '' : 's'}`).join(' · ');
  }
}

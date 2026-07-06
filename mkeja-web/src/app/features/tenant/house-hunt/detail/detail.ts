import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { DiscoveryListing, DiscoveryService } from '../../../../core/services/discovery.service';

@Component({
  selector: 'app-house-hunt-detail',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './detail.html',
  styleUrls: ['./detail.css']
})
export class HouseHuntDetailComponent implements OnInit {
  loading = true;
  acting = false;
  listing: DiscoveryListing | null = null;
  error = '';
  toast = '';
  unitId = 0;
  activeImageIndex = 0;

  constructor(
    private route: ActivatedRoute,
    private discoveryService: DiscoveryService
  ) {}

  ngOnInit(): void {
    this.unitId = Number(this.route.snapshot.params['id']);
    this.discoveryService.getListing(this.unitId).subscribe({
      next: (listing) => {
        this.listing = listing;
        this.loading = false;
      },
      error: (err: Error) => {
        this.error = err.message || 'Listing not found';
        this.loading = false;
      }
    });
  }

  get galleryImages(): string[] {
    if (!this.listing) return [];
    if (this.listing.imageUrls?.length) return this.listing.imageUrls;
    return this.listing.coverImageUrl ? [this.listing.coverImageUrl] : [];
  }

  toggleSave(): void {
    if (!this.listing || this.acting) return;
    this.acting = true;

    if (this.listing.saved) {
      this.discoveryService.unsaveListing(this.listing.unitId).subscribe({
        next: () => {
          if (this.listing) this.listing.saved = false;
          this.toast = 'Removed from saved';
          this.acting = false;
        },
        error: (err: Error) => {
          this.error = err.message;
          this.acting = false;
        }
      });
      return;
    }

    this.discoveryService.saveListing(this.listing.unitId).subscribe({
      next: () => {
        if (this.listing) this.listing.saved = true;
        this.toast = 'Saved to your list';
        this.acting = false;
      },
      error: (err: Error) => {
        this.error = err.message;
        this.acting = false;
      }
    });
  }

  expressInterest(): void {
    if (!this.listing || this.acting) return;
    this.acting = true;
    this.discoveryService.expressInterest(this.listing.unitId, 'Interested via House Hunt').subscribe({
      next: () => {
        this.toast = 'Interest sent to landlord. They may invite you to move in.';
        this.acting = false;
      },
      error: (err: Error) => {
        this.error = err.message;
        this.acting = false;
      }
    });
  }
}

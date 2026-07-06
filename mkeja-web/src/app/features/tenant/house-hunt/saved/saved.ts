import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { DiscoveryListing, DiscoveryService } from '../../../../core/services/discovery.service';

@Component({
  selector: 'app-house-hunt-saved',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './saved.html',
  styleUrls: ['./saved.css']
})
export class HouseHuntSavedComponent implements OnInit {
  loading = true;
  listings: DiscoveryListing[] = [];
  error = '';

  constructor(private discoveryService: DiscoveryService) {}

  ngOnInit(): void {
    this.discoveryService.getSaved().subscribe({
      next: (listings) => {
        this.listings = listings;
        this.loading = false;
      },
      error: (err) => {
        this.error = err.message || 'Unable to load saved listings';
        this.loading = false;
      }
    });
  }
}

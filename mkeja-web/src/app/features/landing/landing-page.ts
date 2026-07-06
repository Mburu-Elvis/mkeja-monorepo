import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NavigationEnd, Router, RouterModule, RouterOutlet } from '@angular/router';
import { filter, Subscription } from 'rxjs';
import { DiscoveryService, PropertyDiscoveryListing } from '../../core/services/discovery.service';
import {
  LANDING_BENEFITS,
  LANDING_MODULES,
  LANDING_PORTALS,
  LANDING_STEPS,
  LANDING_TABS,
  LANDING_TESTIMONIALS,
  LandingTabId
} from './landing-data';

@Component({
  selector: 'app-landing-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, RouterOutlet],
  templateUrl: './landing-page.html',
  styleUrl: './landing.css'
})
export class LandingPageComponent implements OnInit, OnDestroy {
  mobileNavOpen = false;
  activeTab: LandingTabId = 'home';
  showPropertyDetail = false;
  readonly currentYear = new Date().getFullYear();
  readonly tabs = LANDING_TABS;
  readonly modules = LANDING_MODULES;
  readonly benefits = LANDING_BENEFITS;
  readonly portals = LANDING_PORTALS;
  readonly steps = LANDING_STEPS;
  readonly testimonials = LANDING_TESTIMONIALS;

  listingsLoading = false;
  listings: PropertyDiscoveryListing[] = [];
  listingsError = '';
  q = '';
  county = '';
  city = '';
  minRent: number | null = null;
  maxRent: number | null = null;
  minBedrooms: number | null = null;

  private navSub?: Subscription;

  constructor(
    private router: Router,
    private discoveryService: DiscoveryService
  ) {}

  ngOnInit(): void {
    this.syncFromUrl(this.router.url);
    this.navSub = this.router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe((e) => this.syncFromUrl(e.urlAfterRedirects));
  }

  ngOnDestroy(): void {
    this.navSub?.unsubscribe();
  }

  private syncFromUrl(url: string): void {
    const path = url.split('?')[0];
    this.showPropertyDetail = /^\/houses\/[^/]+/.test(path) && path !== '/houses';

    if (this.showPropertyDetail) {
      this.activeTab = 'houses';
      return;
    }

    if (path === '/houses' || path.startsWith('/houses?')) {
      this.activeTab = 'houses';
      if (!this.showPropertyDetail && !this.listings.length && !this.listingsLoading) {
        this.searchListings();
      }
      return;
    }
    if (path === '/about') {
      this.activeTab = 'about';
      return;
    }
    if (path === '/platform') {
      this.activeTab = 'platform';
      return;
    }
    this.activeTab = 'home';
  }

  isTabActive(tabId: LandingTabId): boolean {
    if (tabId === 'houses') {
      return this.activeTab === 'houses' || this.showPropertyDetail;
    }
    return this.activeTab === tabId && !this.showPropertyDetail;
  }

  goToTab(tabId: LandingTabId): void {
    this.closeMobileNav();
    const tab = this.tabs.find((t) => t.id === tabId);
    if (tab) {
      this.router.navigateByUrl(tab.path);
    }
  }

  searchListings(): void {
    this.listingsLoading = true;
    this.listingsError = '';
    this.discoveryService.searchPropertiesPublic({
      q: this.q || undefined,
      county: this.county || undefined,
      city: this.city || undefined,
      minRent: this.minRent ?? undefined,
      maxRent: this.maxRent ?? undefined,
      minBedrooms: this.minBedrooms ?? undefined
    }).subscribe({
      next: (listings) => {
        this.listings = listings;
        this.listingsLoading = false;
      },
      error: (err: Error) => {
        this.listingsError = err.message || 'Unable to load listings';
        this.listingsLoading = false;
      }
    });
  }

  clearListingFilters(): void {
    this.q = '';
    this.county = '';
    this.city = '';
    this.minRent = null;
    this.maxRent = null;
    this.minBedrooms = null;
    this.searchListings();
  }

  locationLabel(item: PropertyDiscoveryListing): string {
    const parts = [item.address, item.city, item.county].filter(Boolean);
    return parts.length ? parts.join(' · ') : 'Kenya';
  }

  toggleMobileNav(): void {
    this.mobileNavOpen = !this.mobileNavOpen;
  }

  closeMobileNav(): void {
    this.mobileNavOpen = false;
  }
}

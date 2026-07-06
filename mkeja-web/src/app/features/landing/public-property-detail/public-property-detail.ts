import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import {
  AvailableUnitListing,
  DiscoveryService,
  PropertyDiscoveryDetail,
  UnitTypeBreakdown
} from '../../../core/services/discovery.service';
import { AuthService } from '../../../core/services/auth';

@Component({
  selector: 'app-public-property-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './public-property-detail.html',
  styleUrl: './public-property-detail.css'
})
export class PublicPropertyDetailComponent implements OnInit {
  loading = true;
  acting = false;
  property: PropertyDiscoveryDetail | null = null;
  modalUnit: AvailableUnitListing | null = null;
  error = '';
  toast = '';
  propertyId = 0;
  guestFullName = '';
  guestPhone = '';
  interestMessage = '';

  overviewIndex = 0;
  selectedCategory: string | null = null;
  modalImageIndex = 0;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private discoveryService: DiscoveryService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.propertyId = Number(this.route.snapshot.params['propertyId']);
    this.loadProperty();
  }

  get isAuthenticated(): boolean {
    return this.authService.isAuthenticated();
  }

  loadProperty(): void {
    this.loading = true;
    const req = this.isAuthenticated
      ? this.discoveryService.getPropertyListing(this.propertyId)
      : this.discoveryService.getPropertyListingPublic(this.propertyId);

    req.subscribe({
      next: (property) => {
        this.property = property;
        this.loading = false;
      },
      error: (err: Error) => {
        this.error = err.message || 'Property not found';
        this.loading = false;
      }
    });
  }

  get overviewImages(): string[] {
    if (!this.property) return [];
    const urls = [...(this.property.imageUrls || [])];
    if (urls.length === 0 && this.property.coverImageUrl) {
      return [this.property.coverImageUrl];
    }
    return urls;
  }

  get galleryThumbs(): string[] {
    return this.overviewImages.slice(1, 5);
  }

  get selectedType(): UnitTypeBreakdown | null {
    if (!this.property || !this.selectedCategory) return null;
    return (this.property.unitTypes ?? []).find((t) => t.unitType === this.selectedCategory) ?? null;
  }

  get filteredUnits(): AvailableUnitListing[] {
    if (!this.property) return [];
    if (!this.selectedCategory) return this.property.units;
    return this.property.units.filter((u) => u.unitType === this.selectedCategory);
  }

  get units(): AvailableUnitListing[] {
    return this.property?.units ?? [];
  }

  locationLabel(): string {
    if (!this.property) return '';
    return [this.property.address, this.property.city, this.property.county].filter(Boolean).join(' · ') || 'Kenya';
  }

  locationShort(): string {
    if (!this.property) return 'Kenya';
    return [this.property.city, this.property.county].filter(Boolean).join(', ') || 'Kenya';
  }

  rentRangeLabel(): string {
    if (!this.property) return '';
    const min = this.property.minRent;
    const max = this.property.maxRent;
    if (min != null && max != null) {
      if (min === max) return `KES ${min.toLocaleString()}/mo`;
      return `KES ${min.toLocaleString()} – ${max.toLocaleString()}/mo`;
    }
    if (min != null) return `From KES ${min.toLocaleString()}/mo`;
    if (max != null) return `Up to KES ${max.toLocaleString()}/mo`;
    return 'Contact for pricing';
  }

  back(): void {
    this.router.navigateByUrl('/houses');
  }

  selectCategory(unitType: string | null): void {
    this.selectedCategory = unitType;
  }

  selectGalleryImage(index: number): void {
    if (index >= 0 && index < this.overviewImages.length) {
      this.overviewIndex = index;
    }
  }

  prevOverview(): void {
    const len = this.overviewImages.length;
    if (len <= 1) return;
    this.overviewIndex = (this.overviewIndex - 1 + len) % len;
  }

  nextOverview(): void {
    const len = this.overviewImages.length;
    if (len <= 1) return;
    this.overviewIndex = (this.overviewIndex + 1) % len;
  }

  scrollToUnits(): void {
    document.getElementById('available-units')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  unitImage(unit: AvailableUnitListing): string | null {
    if (unit.sampleImageUrl) return unit.sampleImageUrl;
    const type = this.property?.unitTypes?.find((t) => t.unitType === unit.unitType);
    if (type?.sampleImageUrl) return type.sampleImageUrl;
    return this.overviewImages[0] ?? null;
  }

  floorLabel(unit: AvailableUnitListing): string {
    const parts: string[] = [];
    if (unit.wing) parts.push(`Wing ${unit.wing}`);
    if (unit.floorNumber != null) parts.push(`Floor ${unit.floorNumber}`);
    return parts.join(' · ');
  }

  openUnit(unit: AvailableUnitListing): void {
    this.modalUnit = unit;
    this.modalImageIndex = 0;
    this.error = '';
    this.interestMessage = `Interested in unit ${unit.unitNumber}`;
    this.prefillContactDetails();
  }

  closeModal(): void {
    this.modalUnit = null;
  }

  modalImages(unit: AvailableUnitListing): string[] {
    const type = (this.property?.unitTypes ?? []).find((t) => t.unitType === unit.unitType);
    if (type?.imageUrls?.length) return type.imageUrls;
    if (type?.sampleImageUrl) return [type.sampleImageUrl];
    const unitImg = this.unitImage(unit);
    return unitImg ? [unitImg] : [];
  }

  prevModalImage(): void {
    const images = this.modalUnit ? this.modalImages(this.modalUnit) : [];
    if (images.length <= 1) return;
    this.modalImageIndex = (this.modalImageIndex - 1 + images.length) % images.length;
  }

  nextModalImage(): void {
    const images = this.modalUnit ? this.modalImages(this.modalUnit) : [];
    if (images.length <= 1) return;
    this.modalImageIndex = (this.modalImageIndex + 1) % images.length;
  }

  private prefillContactDetails(): void {
    const user = this.authService.getCurrentUser();
    if (user) {
      this.guestFullName = user.fullName || '';
      this.guestPhone = user.phone || '';
      return;
    }
    this.guestFullName = '';
    this.guestPhone = '';
  }

  expressInterest(): void {
    if (!this.modalUnit) return;

    const fullName = this.guestFullName.trim();
    const phone = this.guestPhone.trim();
    if (!fullName) {
      this.error = 'Please enter your full name.';
      return;
    }
    if (!phone) {
      this.error = 'Please enter your phone number.';
      return;
    }

    this.acting = true;
    this.error = '';
    const unit = this.modalUnit;

    this.discoveryService
      .expressPublicInterest(unit.unitId, {
        fullName,
        phone,
        message: this.interestMessage.trim() || undefined
      })
      .subscribe({
        next: () => {
          this.toast = `Interest sent for unit ${unit.unitNumber}. We'll contact you soon.`;
          this.acting = false;
          this.closeModal();
        },
        error: (err: Error) => {
          this.error = err.message;
          this.acting = false;
        }
      });
  }
}

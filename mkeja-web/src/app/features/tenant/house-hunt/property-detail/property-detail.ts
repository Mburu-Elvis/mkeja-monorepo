import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import {
  AvailableUnitListing,
  DiscoveryService,
  PropertyDiscoveryDetail,
  UnitTypeBreakdown
} from '../../../../core/services/discovery.service';

@Component({
  selector: 'app-house-hunt-property-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './property-detail.html',
  styleUrls: ['./property-detail.css']
})
export class HouseHuntPropertyDetailComponent implements OnInit {
  loading = true;
  acting = false;
  property: PropertyDiscoveryDetail | null = null;
  selectedCategory: string | null = null;
  filterMinRent: number | null = null;
  filterMaxRent: number | null = null;
  filterFloor: number | null = null;
  overviewIndex = 0;
  typeIndex = 0;
  modalUnit: AvailableUnitListing | null = null;
  modalImageIndex = 0;
  error = '';
  toast = '';
  propertyId = 0;

  constructor(
    private route: ActivatedRoute,
    private discoveryService: DiscoveryService
  ) {}

  ngOnInit(): void {
    this.propertyId = Number(this.route.snapshot.params['propertyId']);
    this.discoveryService.getPropertyListing(this.propertyId).subscribe({
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

  get selectedType(): UnitTypeBreakdown | null {
    if (!this.property || !this.selectedCategory) return null;
    return (this.property.unitTypes ?? []).find((t) => t.unitType === this.selectedCategory) ?? null;
  }

  get typeImages(): string[] {
    const type = this.selectedType;
    if (!type) return [];
    if (type.imageUrls?.length) return type.imageUrls;
    return type.sampleImageUrl ? [type.sampleImageUrl] : [];
  }

  get availableFloors(): number[] {
    if (!this.property) return [];
    return [...new Set(
      this.property.units
        .map((u) => u.floorNumber)
        .filter((f): f is number => f != null)
    )].sort((a, b) => a - b);
  }

  get filteredUnits(): AvailableUnitListing[] {
    if (!this.property) return [];
    let units = this.property.units;
    if (this.selectedCategory) {
      units = units.filter((u) => u.unitType === this.selectedCategory);
    }
    if (this.filterMinRent != null && this.filterMinRent > 0) {
      units = units.filter((u) => (u.rent ?? 0) >= this.filterMinRent!);
    }
    if (this.filterMaxRent != null && this.filterMaxRent > 0) {
      units = units.filter((u) => (u.rent ?? 0) <= this.filterMaxRent!);
    }
    if (this.filterFloor != null) {
      units = units.filter((u) => u.floorNumber === this.filterFloor);
    }
    return units;
  }

  locationLabel(): string {
    if (!this.property) return '';
    const parts = [this.property.address, this.property.city, this.property.county].filter(Boolean);
    return parts.length ? parts.join(' · ') : 'Kenya';
  }

  selectCategory(unitType: string | null): void {
    this.selectedCategory = unitType;
    this.typeIndex = 0;
  }

  clearFilters(): void {
    this.selectedCategory = null;
    this.filterMinRent = null;
    this.filterMaxRent = null;
    this.filterFloor = null;
    this.typeIndex = 0;
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

  prevTypeImage(): void {
    const len = this.typeImages.length;
    if (len <= 1) return;
    this.typeIndex = (this.typeIndex - 1 + len) % len;
  }

  nextTypeImage(): void {
    const len = this.typeImages.length;
    if (len <= 1) return;
    this.typeIndex = (this.typeIndex + 1) % len;
  }

  openUnitModal(unit: AvailableUnitListing): void {
    this.modalUnit = unit;
    this.modalImageIndex = 0;
    this.error = '';
  }

  closeUnitModal(): void {
    this.modalUnit = null;
  }

  modalImages(unit: AvailableUnitListing): string[] {
    const type = (this.property?.unitTypes ?? []).find((t) => t.unitType === unit.unitType);
    if (type?.imageUrls?.length) return type.imageUrls;
    if (type?.sampleImageUrl) return [type.sampleImageUrl];
    return this.overviewImages;
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

  toggleSaveUnit(): void {
    if (!this.modalUnit || this.acting) return;
    this.acting = true;
    const unit = this.modalUnit;

    if (unit.saved) {
      this.discoveryService.unsaveListing(unit.unitId).subscribe({
        next: () => {
          unit.saved = false;
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

    this.discoveryService.saveListing(unit.unitId).subscribe({
      next: () => {
        unit.saved = true;
        this.toast = 'Unit saved';
        this.acting = false;
      },
      error: (err: Error) => {
        this.error = err.message;
        this.acting = false;
      }
    });
  }

  expressInterest(): void {
    if (!this.modalUnit || this.acting) return;
    this.acting = true;
    const unit = this.modalUnit;
    this.discoveryService.expressInterest(unit.unitId, `Interested in unit ${unit.unitNumber}`).subscribe({
      next: () => {
        this.toast = `Interest sent for unit ${unit.unitNumber}. The landlord may invite you to move in.`;
        this.acting = false;
      },
      error: (err: Error) => {
        this.error = err.message;
        this.acting = false;
      }
    });
  }

  floorLabel(unit: AvailableUnitListing): string {
    const parts: string[] = [];
    if (unit.wing) parts.push(`Wing ${unit.wing}`);
    if (unit.floorNumber != null) parts.push(`Floor ${unit.floorNumber}`);
    return parts.join(' · ');
  }
}

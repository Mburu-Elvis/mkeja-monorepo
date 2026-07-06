import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { PropertyService, PropertySummary, UnitSummary } from '../../../../core/services/property.service';
import { AuthService } from '../../../../core/services/auth';

@Component({
  selector: 'app-unit-listing-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './listing-settings.html',
  styleUrls: ['./listing-settings.css']
})
export class UnitListingSettingsComponent implements OnInit {
  propertyId = 0;
  unitId = 0;
  loading = true;
  saving = false;
  error = '';
  success = '';
  unit: UnitSummary | null = null;
  property: PropertySummary | null = null;

  discoverable = false;
  autoRecommend = false;
  promoted = false;
  listingDescription = '';

  kycApproved = false;

  constructor(
    private route: ActivatedRoute,
    private propertyService: PropertyService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.propertyId = Number(this.route.snapshot.params['propertyId']);
    this.unitId = Number(this.route.snapshot.params['unitId']);
    this.kycApproved = this.authService.isLandlordKycApproved();
    this.authService.refreshToken().subscribe({
      next: () => { this.kycApproved = this.authService.isLandlordKycApproved(); }
    });

    this.propertyService.getProperty(this.propertyId).subscribe({
      next: (property) => { this.property = property; },
      error: () => {}
    });

    this.propertyService.getUnitListing(this.propertyId, this.unitId).subscribe({
      next: (unit: UnitSummary) => {
        this.unit = unit;
        this.discoverable = !!unit.discoverable;
        this.autoRecommend = !!unit.autoRecommend;
        this.promoted = !!unit.promoted;
        this.listingDescription = unit.listingDescription || '';
        this.loading = false;
      },
      error: (err: Error) => {
        this.error = err.message;
        this.loading = false;
      }
    });
  }

  get isVacant(): boolean {
    return (this.unit?.status || '').toUpperCase() === 'VACANT';
  }

  get canEnableListing(): boolean {
    return this.kycApproved && !!this.property?.verified && this.isVacant;
  }

  get eligibilityMessage(): string {
    if (!this.unit) return '';
    if (!this.isVacant) return 'Only vacant units can be listed on House Hunt.';
    if (!this.kycApproved) return 'Complete landlord KYC approval before enabling listings.';
    if (!this.property?.verified) return 'This property must be verified by Mkeja before listings go live.';
    return 'This unit is eligible for House Hunt.';
  }

  save(): void {
    this.saving = true;
    this.error = '';
    this.success = '';
    this.propertyService.updateUnitListing(this.propertyId, this.unitId, {
      promoted: this.promoted,
      listingDescription: this.listingDescription
    }).subscribe({
      next: () => {
        this.success = 'Unit listing details saved.';
        this.saving = false;
      },
      error: (err: Error) => {
        this.error = err.message;
        this.saving = false;
      }
    });
  }
}

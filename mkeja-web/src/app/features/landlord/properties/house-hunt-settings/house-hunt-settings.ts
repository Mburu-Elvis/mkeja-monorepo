import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import {
  HouseHuntSettings,
  PropertyService
} from '../../../../core/services/property.service';
import { AuthService } from '../../../../core/services/auth';

@Component({
  selector: 'app-house-hunt-settings',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './house-hunt-settings.html',
  styleUrls: ['./house-hunt-settings.css']
})
export class HouseHuntPropertySettingsComponent implements OnInit {
  propertyId = 0;
  loading = true;
  savingProperty = false;
  error = '';
  success = '';
  settings: HouseHuntSettings | null = null;
  kycApproved = false;

  constructor(
    private route: ActivatedRoute,
    private propertyService: PropertyService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.propertyId = Number(this.route.snapshot.params['propertyId']);
    this.kycApproved = this.authService.isLandlordKycApproved();
    this.authService.refreshToken().subscribe({
      next: () => { this.kycApproved = this.authService.isLandlordKycApproved(); }
    });
    this.loadSettings();
  }

  loadSettings(): void {
    this.loading = true;
    this.error = '';
    this.propertyService.getHouseHuntSettings(this.propertyId).subscribe({
      next: (settings) => {
        this.settings = settings;
        this.loading = false;
      },
      error: (err: Error) => {
        this.error = err.message;
        this.loading = false;
      }
    });
  }

  get canEnableHouseHunt(): boolean {
    return this.kycApproved && !!this.settings?.verified;
  }

  get eligibilityMessage(): string {
    if (!this.settings) return '';
    if (!this.kycApproved) return 'Complete landlord KYC approval before enabling House Hunt.';
    if (!this.settings.verified) return 'This property must be verified by Mkeja before listings go live.';
    return 'Vacant units are listed automatically when House Hunt is enabled.';
  }

  onHouseHuntToggle(event: Event): void {
    event.preventDefault();
    if (!this.settings || this.savingProperty) return;
    const target = event.target as HTMLInputElement;
    const enabled = !this.settings.houseHuntEnabled;
    if (enabled && !this.canEnableHouseHunt) {
      this.error = this.eligibilityMessage;
      target.checked = this.settings.houseHuntEnabled;
      return;
    }
    this.persistPropertySettings({ houseHuntEnabled: enabled }, target);
  }

  onAutoRecommendToggle(event: Event): void {
    event.preventDefault();
    if (!this.settings || this.savingProperty) return;
    const target = event.target as HTMLInputElement;
    const enabled = !this.settings.autoRecommendEnabled;
    if (enabled && !this.canEnableHouseHunt) {
      this.error = this.eligibilityMessage;
      target.checked = this.settings.autoRecommendEnabled;
      return;
    }
    this.persistPropertySettings({ autoRecommendEnabled: enabled }, target);
  }

  private persistPropertySettings(
    payload: { houseHuntEnabled?: boolean; autoRecommendEnabled?: boolean },
    checkbox?: HTMLInputElement
  ): void {
    if (!this.settings) return;
    const previous = {
      houseHuntEnabled: this.settings.houseHuntEnabled,
      autoRecommendEnabled: this.settings.autoRecommendEnabled
    };

    if (payload.houseHuntEnabled !== undefined) {
      this.settings.houseHuntEnabled = payload.houseHuntEnabled;
      if (!payload.houseHuntEnabled) {
        this.settings.autoRecommendEnabled = false;
      }
    }
    if (payload.autoRecommendEnabled !== undefined) {
      this.settings.autoRecommendEnabled = payload.autoRecommendEnabled;
    }

    this.savingProperty = true;
    this.error = '';
    this.success = '';
    this.propertyService.updateHouseHuntSettings(this.propertyId, payload).subscribe({
      next: (settings) => {
        this.settings = settings;
        this.success = 'House Hunt settings updated.';
        this.savingProperty = false;
      },
      error: (err: Error) => {
        this.error = err.message;
        this.settings!.houseHuntEnabled = previous.houseHuntEnabled;
        this.settings!.autoRecommendEnabled = previous.autoRecommendEnabled;
        if (checkbox) {
          checkbox.checked = payload.houseHuntEnabled !== undefined
            ? previous.houseHuntEnabled
            : previous.autoRecommendEnabled;
        }
        this.savingProperty = false;
      }
    });
  }
}

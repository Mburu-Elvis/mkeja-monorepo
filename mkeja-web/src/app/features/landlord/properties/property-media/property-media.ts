import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PropertyImage, PropertyService } from '../../../../core/services/property.service';

const UNIT_TYPE_LABELS: Record<string, string> = {
  STUDIO: 'Studio / Bedsitter',
  BEDSITTER: 'Bedsitter',
  ONE_BEDROOM: '1 Bedroom',
  TWO_BEDROOM: '2 Bedroom',
  THREE_BEDROOM: '3 Bedroom',
  SINGLE: 'Single',
  DOUBLE: 'Double'
};

@Component({
  selector: 'app-property-media',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './property-media.html',
  styleUrls: ['./property-media.css']
})
export class PropertyMediaComponent implements OnInit {
  @Input({ required: true }) propertyId!: number;

  overviewImages: PropertyImage[] = [];
  unitTypes: string[] = [];
  selectedUnitType = '';
  typeImages = new Map<string, PropertyImage[]>();
  loading = true;
  uploadingOverview = false;
  uploadingType = false;
  error = '';
  success = '';

  constructor(private propertyService: PropertyService) {}

  ngOnInit(): void {
    this.loadAll();
  }

  loadAll(): void {
    this.loading = true;
    this.error = '';
    this.propertyService.listPropertyUnitTypes(this.propertyId).subscribe({
      next: (types) => {
        this.unitTypes = types;
        if (this.unitTypes.length && !this.selectedUnitType) {
          this.selectedUnitType = this.unitTypes[0];
        }
        this.loadOverview();
        this.unitTypes.forEach((type) => this.loadTypeImages(type));
        this.loading = false;
      },
      error: (err: Error) => {
        this.error = err.message;
        this.loading = false;
      }
    });
  }

  loadOverview(): void {
    this.propertyService.listOverviewImages(this.propertyId).subscribe({
      next: (images) => { this.overviewImages = images; },
      error: () => {}
    });
  }

  loadTypeImages(unitType: string): void {
    this.propertyService.listUnitTypeSampleImages(this.propertyId, unitType).subscribe({
      next: (images) => { this.typeImages.set(unitType, images); },
      error: () => {}
    });
  }

  selectUnitType(unitType: string): void {
    this.selectedUnitType = unitType;
    if (!this.typeImages.has(unitType)) {
      this.loadTypeImages(unitType);
    }
  }

  labelFor(unitType: string): string {
    return UNIT_TYPE_LABELS[unitType] || unitType.replace(/_/g, ' ').toLowerCase();
  }

  typeImagesFor(unitType: string): PropertyImage[] {
    return this.typeImages.get(unitType) || [];
  }

  onOverviewSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.uploadingOverview = true;
    this.propertyService.uploadPropertyImage(this.propertyId, file).subscribe({
      next: () => {
        this.uploadingOverview = false;
        this.success = 'Overview photo added.';
        this.loadOverview();
      },
      error: (err: Error) => {
        this.error = err.message;
        this.uploadingOverview = false;
      }
    });
  }

  onTypeSampleSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file || !this.selectedUnitType) return;
    this.uploadingType = true;
    this.propertyService.uploadUnitTypeSampleImage(this.propertyId, this.selectedUnitType, file).subscribe({
      next: () => {
        this.uploadingType = false;
        this.success = `Photo added for ${this.labelFor(this.selectedUnitType)}.`;
        this.loadTypeImages(this.selectedUnitType);
        if (!this.unitTypes.includes(this.selectedUnitType)) {
          this.unitTypes = [...this.unitTypes, this.selectedUnitType];
        }
      },
      error: (err: Error) => {
        this.error = err.message;
        this.uploadingType = false;
      }
    });
  }
}

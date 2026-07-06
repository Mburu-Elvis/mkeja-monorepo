import { Component, EventEmitter, Input, Output, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule } from '@angular/forms';
import { Pipe, PipeTransform } from '@angular/core';
import { PropertyService } from '../../../../core/services/property.service';
import { PLATFORM_UNIT_TYPES, PlatformUnitType, unitTypeLabel } from '../../../../shared/constants/unit-types';

// ==================== CUSTOM PIPE FOR REPLACE ====================
@Pipe({
  name: 'replace',
  standalone: true
})
export class ReplacePipe implements PipeTransform {
  transform(value: string, search: string, replacement: string): string {
    if (!value) return value;
    return value.split(search).join(replacement);
  }
}

// ==================== TYPE DEFINITIONS ====================

export type UnitStatus = 'vacant' | 'occupied' | 'reserved' | 'under_maintenance' | 'inactive';
export type FurnishingType = 'unfurnished' | 'semi_furnished' | 'fully_furnished';
export type ConditionType = 'excellent' | 'good' | 'fair' | 'needs_repair';
export type BillingCycle = 'monthly' | 'quarterly' | 'yearly';
export type LateFeeType = 'percentage' | 'fixed';
export type MeterType = 'prepaid' | 'postpaid';

export interface UnitTypeTemplate {
  id: string;
  propertyId: string;
  name: string;
  defaultRent: number;
  defaultDeposit: number;
  defaultServiceCharge: number;
  defaultSize: number;
  defaultFurnishing: FurnishingType;
  defaultFeatures: string[];
  totalUnits: number;
  availableUnits: number;
}

export interface AddUnitPayload {
  unit: {
    propertyId: string;
    unitNumber: string;
    block: string;
    floor: number | null;
    type: string;
    status: UnitStatus;
    condition: ConditionType;
    furnishing: FurnishingType;
    size: number | null;
  };
  pricing: {
    rent: number;
    deposit: number;
    serviceCharge: number;
    billingCycle: BillingCycle;
    currency: string;
    lateFee: {
      type: LateFeeType;
      value: number;
    };
  };
  meters: {
    electricity: { meterNumber: string; type: MeterType };
    water: { meterNumber: string; shared: boolean };
  };
  features: string[];
  maintenance: {
    lastInspectionDate: string;
    issues: string[];
    conditionScore: number;
  };
}

// ==================== MOCK DATA ====================

const MOCK_UNIT_TYPES: UnitTypeTemplate[] = [
  {
    id: 'type_bedsitter',
    propertyId: '',
    name: 'Bedsitter',
    defaultRent: 18000,
    defaultDeposit: 18000,
    defaultServiceCharge: 3000,
    defaultSize: 35,
    defaultFurnishing: 'unfurnished',
    defaultFeatures: ['wardrobe', 'ceiling_fan', 'tiled_flooring'],
    totalUnits: 10,
    availableUnits: 3
  },
  {
    id: 'type_1br',
    propertyId: '',
    name: '1 Bedroom',
    defaultRent: 45000,
    defaultDeposit: 45000,
    defaultServiceCharge: 5000,
    defaultSize: 65,
    defaultFurnishing: 'semi_furnished',
    defaultFeatures: ['balcony', 'wardrobe', 'ceiling_fan', 'tiled_flooring', 'open_kitchen'],
    totalUnits: 8,
    availableUnits: 2
  },
  {
    id: 'type_2br',
    propertyId: '',
    name: '2 Bedroom',
    defaultRent: 75000,
    defaultDeposit: 75000,
    defaultServiceCharge: 7000,
    defaultSize: 95,
    defaultFurnishing: 'semi_furnished',
    defaultFeatures: ['balcony', 'walk_in_closet', 'ceiling_fan', 'tiled_flooring', 'open_kitchen', 'ensuite_bathroom'],
    totalUnits: 5,
    availableUnits: 1
  },
  {
    id: 'type_3br',
    propertyId: '',
    name: '3 Bedroom',
    defaultRent: 120000,
    defaultDeposit: 120000,
    defaultServiceCharge: 10000,
    defaultSize: 140,
    defaultFurnishing: 'fully_furnished',
    defaultFeatures: ['balcony', 'walk_in_closet', 'ac', 'tiled_flooring', 'closed_kitchen', 'ensuite_bathroom', 'laundry_room'],
    totalUnits: 3,
    availableUnits: 1
  },
  {
    id: 'type_studio',
    propertyId: '',
    name: 'Studio',
    defaultRent: 25000,
    defaultDeposit: 25000,
    defaultServiceCharge: 4000,
    defaultSize: 45,
    defaultFurnishing: 'semi_furnished',
    defaultFeatures: ['wardrobe', 'ceiling_fan', 'open_kitchen', 'tiled_flooring'],
    totalUnits: 6,
    availableUnits: 2
  }
];

const MOCK_AVAILABLE_FEATURES: string[] = [
  'balcony', 'wardrobe', 'walk_in_closet', 'ensuite_bathroom', 'study_room',
  'laundry_room', 'open_kitchen', 'closed_kitchen', 'granite_counter', 'cabinet_storage',
  'dishwasher', 'microwave', 'instant_shower', 'bathtub', 'heated_water',
  'ac', 'ceiling_fan', 'heating', 'soundproof', 'tiled_flooring',
  'security_door', 'intercom', 'parking', 'store_room', 'servant_quarters'
];

// ==================== COMPONENT ====================

@Component({
  selector: 'app-add-unit',
  standalone: true,
  imports: [
    CommonModule, 
    ReactiveFormsModule,
    ReplacePipe
  ],
  templateUrl: './add-unit.html',
  styleUrls: ['./add-unit.css']
})
export class LandlordPropertiesAddUnitComponent implements OnInit {
  @Input() propertyId!: string;
  @Input() propertyName: string = '';
  @Input() presentation: 'page' | 'modal' = 'page';
  @Output() unitAdded = new EventEmitter<any>();
  @Output() cancel = new EventEmitter<void>();

  readonly unitTypeMeta: Record<string, { group: 'apartments' | 'rooms'; badge: string; description: string }> = {
    STUDIO: { group: 'apartments', badge: 'ST', description: 'Open-plan living and sleeping space' },
    ONE_BEDROOM: { group: 'apartments', badge: '1B', description: 'One bedroom with a separate living area' },
    TWO_BEDROOM: { group: 'apartments', badge: '2B', description: 'Two bedrooms — suited for small families' },
    THREE_BEDROOM: { group: 'apartments', badge: '3B', description: 'Three bedrooms with expanded living space' },
    SINGLE: { group: 'rooms', badge: 'SR', description: 'Private single room in a shared property' },
    DOUBLE: { group: 'rooms', badge: 'DR', description: 'Shared double room for two occupants' }
  };

  unitForm!: FormGroup;
  currentStep = 1;
  totalSteps = 2;
  isSubmitting = false;
  submitError: string | null = null;
  submitSuccess = false;

  stepNames: string[] = ['', 'Select unit category', 'Unit details & pricing'];

  platformUnitTypes = PLATFORM_UNIT_TYPES;
  selectedUnitType: PlatformUnitType | null = null;

  get isModal(): boolean {
    return this.presentation === 'modal';
  }

  get apartmentUnitTypes(): PlatformUnitType[] {
    return this.platformUnitTypes.filter((type) => this.unitTypeMeta[type.value]?.group === 'apartments');
  }

  get roomUnitTypes(): PlatformUnitType[] {
    return this.platformUnitTypes.filter((type) => this.unitTypeMeta[type.value]?.group === 'rooms');
  }

  typeMeta(type: PlatformUnitType) {
    return this.unitTypeMeta[type.value] ?? {
      group: 'apartments' as const,
      badge: type.label.charAt(0),
      description: 'Rental unit category'
    };
  }

  // Dropdown options
  statusOptions = [
    { value: 'vacant', label: 'Vacant (Ready for tenant)' },
    { value: 'occupied', label: 'Occupied' },
    { value: 'reserved', label: 'Reserved' },
    { value: 'under_maintenance', label: 'Under Maintenance' },
    { value: 'inactive', label: 'Inactive' }
  ];

  conditionOptions = [
    { value: 'excellent', label: 'Excellent' },
    { value: 'good', label: 'Good' },
    { value: 'fair', label: 'Fair' },
    { value: 'needs_repair', label: 'Needs Repair' }
  ];

  furnishingOptions = [
    { value: 'unfurnished', label: 'Unfurnished' },
    { value: 'semi_furnished', label: 'Semi-furnished' },
    { value: 'fully_furnished', label: 'Fully Furnished' }
  ];

  billingCycleOptions = [
    { value: 'monthly', label: 'Monthly' },
    { value: 'quarterly', label: 'Quarterly' },
    { value: 'yearly', label: 'Yearly' }
  ];

  lateFeeTypeOptions = [
    { value: 'percentage', label: 'Percentage (%)' },
    { value: 'fixed', label: 'Fixed (KES)' }
  ];

  meterTypeOptions = [
    { value: 'prepaid', label: 'Prepaid' },
    { value: 'postpaid', label: 'Postpaid' }
  ];

  // Feature categories for better UX
  featureCategories = [
    {
      name: 'Room Features',
      options: ['balcony', 'walk_in_closet', 'wardrobe', 'ensuite_bathroom', 'study_room', 'laundry_room']
    },
    {
      name: 'Kitchen Features',
      options: ['open_kitchen', 'closed_kitchen', 'granite_counter', 'cabinet_storage', 'dishwasher', 'microwave']
    },
    {
      name: 'Bathroom Features',
      options: ['instant_shower', 'bathtub', 'heated_water', 'modern_fixtures', 'separate_toilet']
    },
    {
      name: 'Comfort Features',
      options: ['ac', 'ceiling_fan', 'heating', 'soundproof', 'tiled_flooring']
    },
    {
      name: 'Security Features',
      options: ['security_door', 'security_window', 'peephole', 'intercom', 'cctv_inside']
    },
    {
      name: 'Outdoor Features',
      options: ['balcony', 'terrace', 'garden_access', 'servant_quarters', 'parking', 'store_room']
    }
  ];

  constructor(
    private fb: FormBuilder,
    private propertyService: PropertyService
  ) {}

  ngOnInit(): void {
    this.initializeForm();
    if (this.propertyId) {
      this.propertyService.listPropertyUnitTypes(+this.propertyId).subscribe({
        next: (existing) => {
          if (existing.length) {
            this.platformUnitTypes = [
              ...existing.map((value) => ({ value, label: unitTypeLabel(value) })),
              ...PLATFORM_UNIT_TYPES.filter((t) => !existing.includes(t.value))
            ];
          }
        }
      });
    }
  }

  initializeForm(): void {
    this.unitForm = this.fb.group({
      unitDetails: this.fb.group({
        unitNumber: ['', [Validators.required, Validators.maxLength(20)]],
        block: ['', Validators.maxLength(10)],
        floor: [null, [Validators.required, Validators.min(0), Validators.max(100)]],
        type: ['', Validators.required]
      }),
      pricing: this.fb.group({
        rent: [null, [Validators.required, Validators.min(0)]],
        deposit: [null, [Validators.required, Validators.min(0)]],
        serviceCharge: [0, [Validators.min(0)]]
      })
    });
  }

  // ==================== FORM ARRAY GETTERS ====================

  get featuresArray(): FormArray {
    return this.unitForm.get('features') as FormArray;
  }

  get issuesArray(): FormArray {
    return this.unitForm.get('maintenance.issues') as FormArray;
  }

  addFeature(defaultValue: string = ''): void {
    this.featuresArray.push(this.fb.control(defaultValue));
  }

  removeFeature(index: number): void {
    if (this.featuresArray.length > 0) {
      this.featuresArray.removeAt(index);
    }
  }

  addIssue(): void {
    this.issuesArray.push(this.fb.control(''));
  }

  removeIssue(index: number): void {
    this.issuesArray.removeAt(index);
  }

  // ==================== FEATURE CHECKBOX HELPERS ====================

  isFeatureSelected(feature: string): boolean {
    return this.featuresArray.value.includes(feature);
  }

  toggleFeature(feature: string, event: Event): void {
    const checkbox = event.target as HTMLInputElement;
    const isChecked = checkbox.checked;
    const currentArray = this.featuresArray;
    
    if (isChecked) {
      if (!currentArray.value.includes(feature)) {
        currentArray.push(this.fb.control(feature));
      }
    } else {
      const index = currentArray.value.indexOf(feature);
      if (index > -1) {
        currentArray.removeAt(index);
      }
    }
  }

  // ==================== UNIT TYPE SELECTION ====================

  selectUnitType(type: PlatformUnitType): void {
    this.selectedUnitType = type;
    this.unitForm.get('unitDetails.type')?.setValue(type.value);
    this.currentStep = 2;
  }

  // ==================== FORM NAVIGATION ====================

  nextStep(): void {
    if (this.validateCurrentStep()) {
      if (this.currentStep < this.totalSteps) {
        this.currentStep++;
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  }

  previousStep(): void {
    if (this.currentStep > 1) {
      this.currentStep--;
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  goBackToTypeSelection(): void {
    this.selectedUnitType = null;
    this.currentStep = 1;
  }

  validateCurrentStep(): boolean {
    let controlsToValidate: string[] = [];
    
    switch (this.currentStep) {
      case 1:
        return !!this.selectedUnitType;
      case 2:
        controlsToValidate = ['unitDetails', 'pricing'];
        break;
    }
    
    let isValid = true;
    controlsToValidate.forEach(controlPath => {
      const control = this.unitForm.get(controlPath);
      if (control) {
        control.markAsTouched();
        if (control.invalid) {
          isValid = false;
        }
      }
    });
    
    if (!isValid) {
      this.scrollToFirstError();
    }
    
    return isValid;
  }

  private scrollToFirstError(): void {
    const firstError = document.querySelector('.ng-invalid.ng-touched, .ng-invalid.ng-dirty');
    if (firstError) {
      firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }

  // ==================== FORM VALIDATION HELPERS ====================

  isFieldInvalid(formPath: string, fieldPath: string): boolean {
    const control = this.unitForm.get(`${formPath}.${fieldPath}`);
    return !!control && control.invalid && (control.dirty || control.touched);
  }

  getFieldError(formPath: string, fieldPath: string): string {
    const control = this.unitForm.get(`${formPath}.${fieldPath}`);
    if (!control || !control.errors) return '';
    
    const errors = control.errors;
    if (errors['required']) return 'This field is required';
    if (errors['min']) return `Minimum value is ${errors['min'].min}`;
    if (errors['max']) return `Maximum value is ${errors['max'].max}`;
    return 'Invalid input';
  }

  // ==================== MEDIA HANDLING ====================

  selectedImages: File[] = [];
  imagePreviewUrls: string[] = [];
  selectedVideo: File | null = null;
  videoPreviewUrl: string | null = null;

  onImagesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      const files = Array.from(input.files);
      this.selectedImages.push(...files);
      
      files.forEach(file => {
        const reader = new FileReader();
        reader.onload = (e) => {
          this.imagePreviewUrls.push(e.target?.result as string);
        };
        reader.readAsDataURL(file);
      });
    }
  }

  removeImage(index: number): void {
    this.selectedImages.splice(index, 1);
    this.imagePreviewUrls.splice(index, 1);
  }

  onVideoSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      this.selectedVideo = input.files[0];
      const reader = new FileReader();
      reader.onload = (e) => {
        this.videoPreviewUrl = e.target?.result as string;
      };
      reader.readAsDataURL(this.selectedVideo);
    }
  }

  removeVideo(): void {
    this.selectedVideo = null;
    this.videoPreviewUrl = null;
  }

  // ==================== FORM SUBMISSION ====================

  getPayload(): AddUnitPayload {
    const formValue = this.unitForm.value;
    return {
      unit: {
        propertyId: this.propertyId,
        unitNumber: formValue.unitDetails.unitNumber,
        block: formValue.unitDetails.block,
        floor: formValue.unitDetails.floor,
        type: formValue.unitDetails.type,
        status: 'vacant',
        condition: 'good',
        furnishing: 'unfurnished',
        size: null
      },
      pricing: {
        rent: formValue.pricing.rent,
        deposit: formValue.pricing.deposit,
        serviceCharge: formValue.pricing.serviceCharge,
        billingCycle: 'monthly',
        currency: 'KES',
        lateFee: { type: 'percentage', value: 5 }
      },
      meters: {
        electricity: { meterNumber: '', type: 'prepaid' },
        water: { meterNumber: '', shared: false }
      },
      features: [],
      maintenance: { lastInspectionDate: '', issues: [], conditionScore: 8 }
    };
  }

  onSubmit(): void {
    if (this.unitForm.valid && !this.isSubmitting) {
      this.isSubmitting = true;
      this.submitError = null;
      
      const payload = this.getPayload();
      
      this.propertyService.createUnit(parseInt(this.propertyId, 10), payload).subscribe({
        next: (response) => {
          this.submitSuccess = true;
          this.isSubmitting = false;
          this.unitAdded.emit({
            success: true,
            unitId: String(response.id),
            unitNumber: response.unitNumber,
            propertyId: this.propertyId,
            propertyName: this.propertyName,
            message: 'Unit added successfully',
            unit: payload
          });
          setTimeout(() => { this.submitSuccess = false; }, 3000);
        },
        error: (error) => {
          this.submitError = error.message || 'Failed to add unit';
          this.isSubmitting = false;
        }
      });
    } else {
      this.markAllAsTouched();
      this.scrollToFirstError();
    }
  }

  private markAllAsTouched(): void {
    Object.keys(this.unitForm.controls).forEach(key => {
      const control = this.unitForm.get(key);
      if (control instanceof FormGroup) {
        this.markGroupAsTouched(control);
      } else if (control instanceof FormArray) {
        control.controls.forEach(c => {
          if (c instanceof FormGroup) {
            this.markGroupAsTouched(c);
          } else {
            c.markAsTouched();
          }
        });
      } else {
        control?.markAsTouched();
      }
    });
  }

  private markGroupAsTouched(group: FormGroup): void {
    Object.keys(group.controls).forEach(key => {
      const control = group.get(key);
      if (control instanceof FormGroup) {
        this.markGroupAsTouched(control);
      } else if (control instanceof FormArray) {
        control.controls.forEach(c => {
          if (c instanceof FormGroup) {
            this.markGroupAsTouched(c);
          } else {
            c.markAsTouched();
          }
        });
      } else {
        control?.markAsTouched();
      }
    });
  }

  onCancel(): void {
    this.cancel.emit();
  }
}
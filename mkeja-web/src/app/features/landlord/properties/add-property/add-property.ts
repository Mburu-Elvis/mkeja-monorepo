import { Component, EventEmitter, Output, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, Validators, AbstractControl, ValidationErrors, ReactiveFormsModule } from '@angular/forms';
import { Observable, throwError } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';
import { Router } from '@angular/router';
import { PropertyService } from '../../../../core/services/property.service';

// ==================== TYPE DEFINITIONS ====================

export interface LocationData {
  country: string;
  county: string;
  subCounty: string;
  area: string;
  addressLine1: string;
  postalCode: string;
  latitude: number | null;
  longitude: number | null;
  landmark: string;
}

export interface StructureData {
  blocks: number | null;
  floors: number | null;
  unitsPerFloor: number | null;
  parkingSlots: number | null;
  lifts: number | null;
  constructionType: string;
}

export interface UtilitiesData {
  waterSource: string[];
  electricityProvider: string;
  backupPower: boolean;
  internetProviders: string[];
  wasteManagement: string;
}

export interface SecurityData {
  cctv: boolean;
  guards: boolean;
  accessControl: string;
  perimeterWall: boolean;
  electricFence: boolean;
}

export interface InsurancePolicy {
  provider: string;
  expiryDate: string;
}

export interface LegalData {
  titleDeedNumber: string;
  ownershipVerified: boolean;
  complianceCertificates: string[];
  insurancePolicy: InsurancePolicy;
}

export interface OwnerData {
  name: string;
  phone: string;
  email: string;
}

export interface ManagerData {
  company: string;
  contactPerson: string;
  phone: string;
}

export interface OperatingCosts {
  security: number | null;
  cleaning: number | null;
  maintenance: number | null;
  utilities: number | null;
}

export interface FinancialsData {
  expectedMonthlyRevenue: number | null;
  occupancyRate: number | null;
  operatingCosts: OperatingCosts;
  serviceChargePerUnit: number | null;
  currency: string;
}

export interface UnitType {
  type: string;
  totalUnits: number | null;
  rent: number | null;
  block?: string | null;
}

export interface MediaData {
  images: File[];
  videos: File[];
}

export interface DocumentFile {
  name: string;
  file: File;
}

export interface AddPropertyPayload {
  property: {
    name: string;
    type: string;
    status: string;
    yearBuilt: number | null;
    floors: number | null;
    totalUnits: number | null;
    ownershipType: string;
    managementType: string;
    description: string;
  };
  location: LocationData;
  structure: StructureData;
  utilities: UtilitiesData;
  security: SecurityData;
  legal: LegalData;
  owner: OwnerData;
  manager: ManagerData | null;
  financials: FinancialsData;
  unitTypes: UnitType[];
  unitGenerationMode: 'auto' | 'manual';
}

// ==================== CUSTOM PIPE FOR REPLACE ====================
import { Pipe, PipeTransform } from '@angular/core';
import { SidebarComponent } from '../../../../shared/components/sidebar/sidebar';

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

// ==================== COMPONENT ====================

@Component({
  selector: 'app-add-property',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ReplacePipe,
    SidebarComponent
  ],
  templateUrl: './add-property.html',
  styleUrls: ['./add-property.css']
})
export class AddPropertyComponent implements OnInit {
  @Output() propertyAdded = new EventEmitter<any>();
  @Output() cancel = new EventEmitter<void>();

  propertyForm!: FormGroup;
  currentStep = 1;
  totalSteps = 8;
  isSubmitting = false;
  submitError: string | null = null;
  submitSuccess = false;
  creationComplete = false;
  createdPropertyId: number | null = null;
  createdPropertyName = '';

  // Dropdown options
  propertyTypes = [
    { value: 'apartment_block', label: 'Apartment Block' },
    { value: 'single_building', label: 'Single Building' },
    { value: 'mixed_use', label: 'Mixed Use' },
    { value: 'commercial', label: 'Commercial' },
    { value: 'gated_community', label: 'Gated Community' }
  ];

  ownershipTypes = [
    { value: 'freehold', label: 'Freehold' },
    { value: 'leasehold', label: 'Leasehold' },
    { value: 'sectional', label: 'Sectional' }
  ];

  managementTypes = [
    { value: 'self_managed', label: 'Self Managed' },
    { value: 'property_manager', label: 'Property Management Company' },
    { value: 'tenant_managed', label: 'Tenant Managed' }
  ];

  constructionTypes = [
    { value: 'reinforced_concrete', label: 'Reinforced Concrete' },
    { value: 'steel_frame', label: 'Steel Frame' },
    { value: 'timber', label: 'Timber' },
    { value: 'stone', label: 'Stone' }
  ];

  electricityProviders = [
    { value: 'KPLC', label: 'KPLC' },
    { value: 'Rural_Electrification', label: 'Rural Electrification' },
    { value: 'private_generator', label: 'Private Generator' }
  ];

  wasteManagementOptions = [
    { value: 'county_government', label: 'County Government' },
    { value: 'private_contractor', label: 'Private Contractor' },
    { value: 'onsite_recycling', label: 'Onsite Recycling' }
  ];

  accessControlOptions = [
    { value: 'manual', label: 'Manual (Guard)' },
    { value: 'keycard', label: 'Keycard' },
    { value: 'biometric', label: 'Biometric' },
    { value: 'smartphone_app', label: 'Smartphone App' }
  ];

  waterSourceOptions = ['municipal', 'borehole', 'rainwater_harvesting', 'water_bowser'];
  internetOptions = ['Safaricom', 'Zuku', 'JTL', 'Liquid', 'AirTel', 'Other'];
  certificateOptions = ['fire_safety', 'occupancy_certificate', 'environmental_impact', 'structural_compliance'];

  counties = [
    'Mombasa', 'Kwale', 'Kilifi', 'Tana River', 'Lamu', 'Taita Taveta',
    'Garissa', 'Wajir', 'Mandera', 'Marsabit', 'Isiolo', 'Meru', 'Tharaka Nithi',
    'Embu', 'Kitui', 'Machakos', 'Makueni', 'Nyandarua', 'Nyeri', 'Kirinyaga',
    'Muranga', 'Kiambu', 'Turkana', 'West Pokot', 'Samburu', 'Trans Nzoia',
    'Uasin Gishu', 'Elgeyo Marakwet', 'Nandi', 'Baringo', 'Laikipia', 'Nakuru',
    'Narok', 'Kajiado', 'Kericho', 'Bomet', 'Kakamega', 'Vihiga', 'Bungoma',
    'Busia', 'Siaya', 'Kisumu', 'Homa Bay', 'Migori', 'Kisii', 'Nyamira', 'Nairobi'
  ];

  constructor(
    private fb: FormBuilder,
    private propertyService: PropertyService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.initializeForm();
  }

  // Helper for form validation display
  isFieldInvalid(fieldPath: string): boolean {
    const control = this.propertyForm.get(fieldPath);
    return !!control && control.invalid && (control.dirty || control.touched);
  }

  getFieldError(fieldPath: string): string {
    const control = this.propertyForm.get(fieldPath);
    if (!control || !control.errors) return '';
    
    const errors = control.errors;
    if (errors['required']) return 'This field is required';
    if (errors['email']) return 'Invalid email address';
    if (errors['min']) return `Minimum value is ${errors['min'].min}`;
    if (errors['max']) return `Maximum value is ${errors['max'].max}`;
    if (errors['pattern']) return 'Invalid format';
    return 'Invalid input';
  }

  initializeForm(): void {
    this.propertyForm = this.fb.group({
      // Step 1: Property
      property: this.fb.group({
        name: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(200)]],
        type: ['apartment_block', Validators.required],
        status: ['active'],
        yearBuilt: [null, [Validators.min(1800), Validators.max(new Date().getFullYear())]],
        ownershipType: ['freehold', Validators.required],
        managementType: ['self_managed', Validators.required],
        description: ['', [Validators.maxLength(2000)]]
      }),

      // Step 2: Location
      location: this.fb.group({
        country: ['Kenya', Validators.required],
        county: ['', Validators.required],
        subCounty: ['', Validators.maxLength(100)],
        area: ['', Validators.maxLength(100)],
        addressLine1: ['', [Validators.required, Validators.maxLength(255)]],
        postalCode: ['', Validators.pattern('^[0-9]{5}$')],
        latitude: [null, [Validators.min(-90), Validators.max(90)]],
        longitude: [null, [Validators.min(-180), Validators.max(180)]],
        landmark: ['', Validators.maxLength(255)]
      }),

      // Step 3: Structure
      structure: this.fb.group({
        blocks: [null, [Validators.min(1), Validators.max(50)]],
        floors: [null, [Validators.min(1), Validators.max(100)]],
        unitsPerFloor: [null, [Validators.min(1), Validators.max(50)]],
        parkingSlots: [null, [Validators.min(0), Validators.max(2000)]],
        lifts: [null, [Validators.min(0), Validators.max(20)]],
        constructionType: ['']
      }),

      // Step 4: Utilities
      utilities: this.fb.group({
        waterSource: this.fb.array([], this.validateWaterSource),
        electricityProvider: ['KPLC'],
        backupPower: [false],
        internetProviders: this.fb.array([]),
        wasteManagement: ['private_contractor']
      }),

      // Step 5: Security
      security: this.fb.group({
        cctv: [false],
        guards: [false],
        accessControl: ['manual'],
        perimeterWall: [false],
        electricFence: [false]
      }),

      // Step 6: Legal
      legal: this.fb.group({
        titleDeedNumber: ['', [Validators.required, Validators.maxLength(50)]],
        ownershipVerified: [false],
        complianceCertificates: this.fb.array([]),
        insurancePolicy: this.fb.group({
          provider: [''],
          expiryDate: ['']
        })
      }),

      // Step 7: Ownership & Management
      owner: this.fb.group({
        name: [''],
        phone: [''],
        email: ['']
      }),
      manager: this.fb.group({
        company: [''],
        contactPerson: [''],
        phone: ['', Validators.pattern('^254[0-9]{9}$')]
      }),

      // Step 8: Financials
      financials: this.fb.group({
        expectedMonthlyRevenue: [null, [Validators.min(0), Validators.max(100_000_000)]],
        occupancyRate: [null, [Validators.min(0), Validators.max(1)]],
        operatingCosts: this.fb.group({
          security: [null, [Validators.min(0)]],
          cleaning: [null, [Validators.min(0)]],
          maintenance: [null, [Validators.min(0)]],
          utilities: [null, [Validators.min(0)]]
        }),
        serviceChargePerUnit: [null, [Validators.min(0)]],
        currency: ['KES']
      }),

      // Step 9: Unit Types
      unitTypes: this.fb.array([]),
      unitGenerationMode: ['auto', Validators.required]
    });

    // Add at least one unit type
    this.addUnitType();
  }

  // ==================== UTILITY VALIDATORS ====================
  
  validateWaterSource(control: AbstractControl): ValidationErrors | null {
    const value = control.value as string[];
    if (!value || value.length === 0) {
      return { requiredAtLeastOne: 'Select at least one water source' };
    }
    return null;
  }

  // ==================== FORM ARRAY GETTERS ====================

  get waterSourceArray(): FormArray {
    return this.propertyForm.get('utilities.waterSource') as FormArray;
  }

  get internetProvidersArray(): FormArray {
    return this.propertyForm.get('utilities.internetProviders') as FormArray;
  }

  get complianceCertificatesArray(): FormArray {
    return this.propertyForm.get('legal.complianceCertificates') as FormArray;
  }

  get unitTypesArray(): FormArray {
    return this.propertyForm.get('unitTypes') as FormArray;
  }

  // ==================== UNIT TYPES MANAGEMENT ====================

  addUnitType(): void {
    const unitTypeGroup = this.fb.group({
      type: ['', Validators.required],
      block: [''],
      totalUnits: [null, [Validators.required, Validators.min(1)]],
      rent: [null, [Validators.required, Validators.min(0)]]
    });
    this.unitTypesArray.push(unitTypeGroup);
  }

  get structureSummary(): string {
    const structure = this.propertyForm.get('structure')?.value;
    const blocks = structure?.blocks || 1;
    const floors = structure?.floors || 0;
    const perFloor = structure?.unitsPerFloor || 0;
    if (!floors) {
      return 'Set blocks and floors in the Structure step first.';
    }
    const capacity = blocks * floors * (perFloor || 0);
    return `${blocks} block(s) · ${floors} floor(s) · ${perFloor || '?'} units/floor (${capacity || '?'} total capacity)`;
  }

  get plannedUnitTotal(): number {
    return this.unitTypesArray.controls.reduce((sum, control) => {
      const count = control.get('totalUnits')?.value;
      return sum + (count ? Number(count) : 0);
    }, 0);
  }

  removeUnitType(index: number): void {
    if (this.unitTypesArray.length > 1) {
      this.unitTypesArray.removeAt(index);
    }
  }

  // ==================== CHECKBOX TOGGLE METHODS ====================

  toggleWaterSource(source: string, event: Event): void {
    const isChecked = (event.target as HTMLInputElement).checked;
    const currentArray = this.waterSourceArray;
    
    if (isChecked) {
      if (!currentArray.value.includes(source)) {
        currentArray.push(this.fb.control(source));
      }
    } else {
      const index = currentArray.value.indexOf(source);
      if (index > -1) {
        currentArray.removeAt(index);
      }
    }
    // Trigger validation
    currentArray.updateValueAndValidity();
  }

  isWaterSourceSelected(source: string): boolean {
    return this.waterSourceArray.value.includes(source);
  }

  toggleInternetProvider(provider: string, event: Event): void {
    const isChecked = (event.target as HTMLInputElement).checked;
    const currentArray = this.internetProvidersArray;
    
    if (isChecked) {
      if (!currentArray.value.includes(provider)) {
        currentArray.push(this.fb.control(provider));
      }
    } else {
      const index = currentArray.value.indexOf(provider);
      if (index > -1) {
        currentArray.removeAt(index);
      }
    }
  }

  isInternetProviderSelected(provider: string): boolean {
    return this.internetProvidersArray.value.includes(provider);
  }

  toggleCertificate(cert: string, event: Event): void {
    const isChecked = (event.target as HTMLInputElement).checked;
    const currentArray = this.complianceCertificatesArray;
    
    if (isChecked) {
      if (!currentArray.value.includes(cert)) {
        currentArray.push(this.fb.control(cert));
      }
    } else {
      const index = currentArray.value.indexOf(cert);
      if (index > -1) {
        currentArray.removeAt(index);
      }
    }
  }

  isCertificateSelected(cert: string): boolean {
    return this.complianceCertificatesArray.value.includes(cert);
  }

  // ==================== MEDIA HANDLING ====================

  selectedImages: File[] = [];
  selectedDocuments: DocumentFile[] = [];
  imagePreviewUrls: string[] = [];

  onImagesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      const files = Array.from(input.files);
      this.selectedImages.push(...files);
      
      // Generate preview URLs
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

  onDocumentsSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      const files = Array.from(input.files);
      files.forEach(file => {
        this.selectedDocuments.push({ name: file.name, file });
      });
    }
  }

  removeDocument(index: number): void {
    this.selectedDocuments.splice(index, 1);
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

  validateCurrentStep(): boolean {
    let controlsToValidate: string[] = [];
    let isValid = true;
    
    switch (this.currentStep) {
      case 1:
        controlsToValidate = ['property'];
        break;
      case 2:
        controlsToValidate = ['location'];
        break;
      case 3:
        controlsToValidate = ['structure'];
        break;
      case 4:
        controlsToValidate = ['utilities'];
        break;
      case 5:
        controlsToValidate = ['security'];
        break;
      case 6:
        controlsToValidate = ['legal'];
        break;
      case 7:
        controlsToValidate = ['financials'];
        break;
      case 8:
        controlsToValidate = ['unitTypes', 'unitGenerationMode'];
        if (this.propertyForm.get('unitGenerationMode')?.value === 'auto') {
          const structure = this.propertyForm.get('structure');
          if (structure?.invalid) {
            structure.markAllAsTouched();
            isValid = false;
          }
        }
        break;
    }
    
    controlsToValidate.forEach(controlPath => {
      const control = this.propertyForm.get(controlPath);
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

  // ==================== FORM SUBMISSION ====================

  getPayload(): AddPropertyPayload {
    const formValue = this.propertyForm.value;
    const structure = formValue.structure || {};
    
    return {
      property: {
        name: formValue.property.name,
        type: formValue.property.type,
        status: formValue.property.status,
        yearBuilt: formValue.property.yearBuilt,
        floors: structure.floors ?? null,
        totalUnits: this.plannedUnitTotal || null,
        ownershipType: formValue.property.ownershipType,
        managementType: formValue.property.managementType,
        description: formValue.property.description
      },
      location: formValue.location,
      structure: formValue.structure,
      utilities: formValue.utilities,
      security: formValue.security,
      legal: formValue.legal,
      owner: formValue.owner,
      manager: formValue.manager.company ? formValue.manager : null,
      financials: formValue.financials,
      unitTypes: formValue.unitTypes,
      unitGenerationMode: formValue.unitGenerationMode
    };
  }

  onSubmit(): void {
    if (this.creationComplete || this.isSubmitting) {
      return;
    }

    if (this.propertyForm.valid && !this.isSubmitting) {
      this.isSubmitting = true;
      this.submitError = null;
      
      const payload = this.getPayload();
      const formData = new FormData();
      
      // Append JSON data
      formData.append('propertyData', JSON.stringify(payload));
      
      // Append images
      this.selectedImages.forEach((image, index) => {
        formData.append(`images`, image, `image_${index}_${Date.now()}.jpg`);
      });
      
      // Append documents
      this.selectedDocuments.forEach((doc, index) => {
        formData.append(`documents`, doc.file, doc.name);
      });
      
      this.propertyService.createProperty(formData)
        .pipe(
          catchError(error => {
            this.submitError = error.error?.message || error.message || 'Failed to add property. Please try again.';
            return throwError(() => error);
          }),
          finalize(() => {
            this.isSubmitting = false;
          })
        )
        .subscribe({
          next: (response) => {
            this.creationComplete = true;
            this.submitSuccess = true;
            this.createdPropertyId = response.id;
            this.createdPropertyName = response.name;
            this.propertyAdded.emit(response);
          },
          error: (error) => {
            console.error('Error adding property:', error);
          }
        });
    } else {
      this.markAllAsTouched();
      this.scrollToFirstError();
    }
  }

  private markAllAsTouched(): void {
    Object.keys(this.propertyForm.controls).forEach(key => {
      const control = this.propertyForm.get(key);
      if (control instanceof FormGroup) {
        this.markGroupAsTouched(control);
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

  goToCreatedProperty(): void {
    if (this.createdPropertyId) {
      this.router.navigate(['/landlord/properties', this.createdPropertyId]);
    }
  }

  addAnotherProperty(): void {
    this.creationComplete = false;
    this.submitSuccess = false;
    this.createdPropertyId = null;
    this.currentStep = 1;
    this.propertyForm.reset();
    this.initializeForm();
    this.selectedImages = [];
    this.imagePreviewUrls = [];
    this.selectedDocuments = [];
  }

  onCancel(): void {
    this.cancel.emit();
  }
}
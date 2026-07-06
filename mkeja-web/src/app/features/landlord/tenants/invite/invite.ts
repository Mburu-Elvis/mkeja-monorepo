import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Subject, debounceTime, distinctUntilChanged, switchMap, of, takeUntil } from 'rxjs';
import { ToastComponent } from '../../../../shared/components/toast/toast';
import { AuthService } from '../../../../core/services/auth';
import { InvitationService } from '../../../../core/services/invitation.service';
import { LandlordService, TenantLookupResult } from '../../../../core/services/landlord.service';
import { PropertyService, UnitSummary } from '../../../../core/services/property.service';

interface PropertyOption {
  id: number;
  name: string;
  vacantCount: number;
}

@Component({
  selector: 'app-landlord-tenants-invite',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, ToastComponent],
  templateUrl: './invite.html',
  styleUrls: ['./invite.css']
})
export class LandlordTenantsInviteComponent implements OnInit, OnDestroy {
  step = 1;
  units: UnitSummary[] = [];
  selectedUnit: UnitSummary | null = null;

  selectedPropertyId = '';
  selectedFloor = 'all';
  selectedWing = 'all';
  unitSearchTerm = '';

  formData = {
    fullName: '',
    phone: '',
    email: '',
    unitId: '',
    monthlyRent: 0,
    depositAmount: 0,
    rentDueDay: 1,
    leaseStartDate: new Date().toISOString().split('T')[0],
    leaseEndDate: ''
  };

  tenantLookup: TenantLookupResult | null = null;
  lookupLoading = false;
  submitting = false;
  loadingUnits = true;
  showToast = false;
  toastMessage = '';
  toastType: 'success' | 'error' | 'warning' | 'info' = 'info';
  kycNotApproved = false;

  private phoneLookup$ = new Subject<string>();
  private destroy$ = new Subject<void>();

  readonly rentDueOptions = Array.from({ length: 28 }, (_, i) => i + 1);
  readonly noWingKey = '__none__';

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private invitationService: InvitationService,
    private propertyService: PropertyService,
    private landlordService: LandlordService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.kycNotApproved = !this.authService.isLandlordKycApproved();
    this.authService.refreshToken().subscribe({
      next: () => { this.kycNotApproved = !this.authService.isLandlordKycApproved(); }
    });

    const preselectedPropertyId = this.route.snapshot.queryParamMap.get('propertyId');
    const preselectedUnitId = this.route.snapshot.queryParamMap.get('unitId');
    const preselectedPhone = this.route.snapshot.queryParamMap.get('phone');
    const preselectedName = this.route.snapshot.queryParamMap.get('name');
    const fromLead = this.route.snapshot.queryParamMap.get('fromLead');

    this.propertyService.listVacantUnits().subscribe({
      next: (units) => {
        this.units = units;
        this.loadingUnits = false;
        if (preselectedPhone) {
          this.formData.phone = preselectedPhone;
          this.onPhoneChange();
        }
        if (preselectedName) {
          this.formData.fullName = preselectedName;
        }
        if (preselectedPropertyId && this.properties.some(p => String(p.id) === preselectedPropertyId)) {
          this.onPropertySelect(preselectedPropertyId);
        }
        if (preselectedUnitId) {
          this.onUnitSelect(preselectedUnitId);
          if (fromLead === '1') {
            this.step = 2;
          }
        }
      },
      error: (err) => {
        this.loadingUnits = false;
        this.showError(err.message || 'Failed to load vacant units');
      }
    });

    this.phoneLookup$.pipe(
      debounceTime(400),
      distinctUntilChanged(),
      switchMap(phone => {
        const normalized = this.normalizePhone(phone);
        if (!normalized.startsWith('254') || normalized.length !== 12) {
          this.tenantLookup = null;
          this.lookupLoading = false;
          return of(null);
        }
        this.lookupLoading = true;
        return this.landlordService.lookupTenant(normalized);
      }),
      takeUntil(this.destroy$)
    ).subscribe({
      next: (result) => {
        this.lookupLoading = false;
        if (result) {
          this.tenantLookup = result;
          if (result.registered && result.fullName && !this.formData.fullName) {
            this.formData.fullName = result.fullName;
          }
        }
      },
      error: () => {
        this.lookupLoading = false;
        this.tenantLookup = null;
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get isSearchMode(): boolean {
    return this.unitSearchTerm.trim().length > 0;
  }

  get properties(): PropertyOption[] {
    const map = new Map<number, PropertyOption>();
    for (const unit of this.units) {
      const existing = map.get(unit.propertyId);
      if (existing) {
        existing.vacantCount++;
      } else {
        map.set(unit.propertyId, {
          id: unit.propertyId,
          name: unit.propertyName || `Property ${unit.propertyId}`,
          vacantCount: 1
        });
      }
    }
    return [...map.values()].sort((a, b) => a.name.localeCompare(b.name));
  }

  get propertyUnits(): UnitSummary[] {
    if (!this.selectedPropertyId) return [];
    return this.units.filter(u => String(u.propertyId) === this.selectedPropertyId);
  }

  get availableFloors(): number[] {
    return [...new Set(
      this.propertyUnits
        .map(u => u.floorNumber)
        .filter((f): f is number => f != null && !Number.isNaN(f))
    )].sort((a, b) => a - b);
  }

  get availableWings(): string[] {
    let list = this.propertyUnits;
    if (this.selectedFloor !== 'all') {
      list = list.filter(u => this.floorKey(u) === this.selectedFloor);
    }
    const wings = new Set(list.map(u => this.wingKey(u)));
    return [...wings].sort((a, b) => this.wingLabel(a).localeCompare(this.wingLabel(b)));
  }

  get filteredUnits(): UnitSummary[] {
    if (this.isSearchMode) {
      const term = this.unitSearchTerm.trim().toLowerCase();
      return this.units
        .filter(u =>
          (u.propertyName || '').toLowerCase().includes(term) ||
          u.unitNumber.toLowerCase().includes(term) ||
          String(u.floorNumber ?? '').includes(term) ||
          (u.wing || '').toLowerCase().includes(term) ||
          this.locationLabel(u).toLowerCase().includes(term)
        )
        .sort((a, b) =>
          (a.propertyName || '').localeCompare(b.propertyName || '') ||
          a.unitNumber.localeCompare(b.unitNumber)
        );
    }

    if (!this.selectedPropertyId) return [];

    let list = this.propertyUnits;
    if (this.selectedFloor !== 'all') {
      list = list.filter(u => this.floorKey(u) === this.selectedFloor);
    }
    if (this.selectedWing !== 'all') {
      list = list.filter(u => this.wingKey(u) === this.selectedWing);
    }
    return list.sort((a, b) => a.unitNumber.localeCompare(b.unitNumber, undefined, { numeric: true }));
  }

  get selectedUnitLabel(): string {
    if (!this.selectedUnit) return '';
    return `${this.selectedUnit.propertyName}${this.locationLabel(this.selectedUnit)} · Unit ${this.selectedUnit.unitNumber}`;
  }

  get canProceedStep1(): boolean {
    return !!this.formData.unitId;
  }

  get canProceedStep2(): boolean {
    const phone = this.normalizePhone(this.formData.phone);
    return !!this.formData.fullName && phone.startsWith('254') && phone.length === 12;
  }

  get canSubmit(): boolean {
    return this.canProceedStep2 && !!this.formData.leaseStartDate && this.formData.rentDueDay >= 1;
  }

  get showFloorStep(): boolean {
    return !this.isSearchMode && !!this.selectedPropertyId && this.availableFloors.length > 0;
  }

  get showWingStep(): boolean {
    return !this.isSearchMode && !!this.selectedPropertyId && this.availableWings.length > 1;
  }

  get showUnitList(): boolean {
    return this.isSearchMode || !!this.selectedPropertyId;
  }

  onPropertySelect(propertyId: string): void {
    this.selectedPropertyId = propertyId;
    this.selectedFloor = 'all';
    this.selectedWing = 'all';
    this.clearUnitSelection();
  }

  onFloorSelect(floor: string): void {
    this.selectedFloor = floor;
    this.selectedWing = 'all';
    this.clearUnitSelection();
  }

  onWingSelect(wing: string): void {
    this.selectedWing = wing;
    this.clearUnitSelection();
  }

  onSearchChange(): void {
    if (this.isSearchMode) {
      this.selectedPropertyId = '';
      this.selectedFloor = 'all';
      this.selectedWing = 'all';
    }
    this.clearUnitSelection();
  }

  clearSearch(): void {
    this.unitSearchTerm = '';
    this.clearUnitSelection();
  }

  onUnitSelect(unitId: string): void {
    this.formData.unitId = unitId;
    this.selectedUnit = this.units.find(u => String(u.id) === unitId) || null;
    if (this.selectedUnit) {
      this.formData.monthlyRent = this.selectedUnit.rent;
      this.formData.depositAmount = this.selectedUnit.deposit || this.selectedUnit.rent;
      if (this.selectedUnit.rentDueDay) {
        this.formData.rentDueDay = this.selectedUnit.rentDueDay;
      }
      if (this.isSearchMode) {
        this.selectedPropertyId = String(this.selectedUnit.propertyId);
        this.selectedFloor = this.floorKey(this.selectedUnit);
        this.selectedWing = this.wingKey(this.selectedUnit);
      }
    }
  }

  onPhoneChange(): void {
    this.phoneLookup$.next(this.formData.phone);
  }

  nextStep(): void {
    if (this.step === 1 && this.canProceedStep1) this.step = 2;
    else if (this.step === 2 && this.canProceedStep2) this.step = 3;
  }

  prevStep(): void {
    if (this.step > 1) this.step--;
  }

  onSubmit(): void {
    if (!this.canSubmit || this.kycNotApproved) return;

    const phone = this.normalizePhone(this.formData.phone);
    this.submitting = true;

    this.invitationService.createInvitation({
      fullName: this.formData.fullName.trim(),
      phone,
      email: this.formData.email?.trim() || undefined,
      unitId: parseInt(this.formData.unitId, 10),
      monthlyRent: this.formData.monthlyRent,
      depositAmount: this.formData.depositAmount,
      rentDueDay: this.formData.rentDueDay,
      leaseStartDate: this.formData.leaseStartDate,
      leaseEndDate: this.formData.leaseEndDate || undefined
    }).subscribe({
      next: (response) => {
        this.submitting = false;
        this.toastType = response.tenancyCreated ? 'success' : 'info';
        this.toastMessage = response.message || 'Invitation sent successfully';
        this.showToast = true;
        setTimeout(() => this.router.navigate(['/landlord/tenants']), 2200);
      },
      error: (err) => {
        this.submitting = false;
        this.showError(err.message || 'Failed to send invitation');
      }
    });
  }

  formatRentDue(day: number): string {
    const suffix = day >= 11 && day <= 13 ? 'th' :
      day % 10 === 1 ? 'st' : day % 10 === 2 ? 'nd' : day % 10 === 3 ? 'rd' : 'th';
    return `${day}${suffix} of each month`;
  }

  wingLabel(wingKey: string): string {
    return wingKey === this.noWingKey ? 'Main building' : wingKey;
  }

  floorLabel(floor: number): string {
    return `Floor ${floor}`;
  }

  locationLabel(unit: UnitSummary): string {
    const parts: string[] = [];
    if (unit.wing) parts.push(unit.wing);
    if (unit.floorNumber != null) parts.push(this.floorLabel(unit.floorNumber));
    return parts.length ? ` · ${parts.join(' · ')}` : '';
  }

  closeToast(): void { this.showToast = false; }

  private floorKey(unit: UnitSummary): string {
    return unit.floorNumber != null ? String(unit.floorNumber) : 'all';
  }

  private wingKey(unit: UnitSummary): string {
    return unit.wing?.trim() ? unit.wing.trim() : this.noWingKey;
  }

  private clearUnitSelection(): void {
    this.formData.unitId = '';
    this.selectedUnit = null;
  }

  private showError(message: string): void {
    this.toastType = 'error';
    this.toastMessage = message;
    this.showToast = true;
  }

  private normalizePhone(input: string): string {
    let cleaned = input.replace(/\D/g, '');
    if (cleaned.startsWith('254')) cleaned = cleaned.substring(3);
    else if (cleaned.startsWith('0')) cleaned = cleaned.substring(1);
    return '254' + cleaned.substring(0, 9);
  }
}

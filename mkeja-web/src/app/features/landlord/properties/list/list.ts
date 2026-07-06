import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatIconModule, MatIconRegistry } from '@angular/material/icon';
import { DomSanitizer } from '@angular/platform-browser';
import { LandlordPropertiesAddUnitComponent } from '../add-unit/add-unit';
import { AuthService } from '../../../../core/services/auth';
import { PropertyService, PropertySummary } from '../../../../core/services/property.service';
import {
  HomeIcon, BuildingIcon, BanknoteIcon, MailIcon, UnlockIcon, RefreshCwIcon
} from '../../../../shared/components/icons';

interface PropertyCard {
  id: string;
  name: string;
  address: string;
  unitsCount: number;
  occupiedCount: number;
  vacantCount: number;
  monthlyRentRoll: number;
  rentDueDay?: number;
  nextRentDueLabel?: string;
  pendingInvites: number;
  type: 'residential' | 'commercial';
  status: 'active' | 'maintenance' | 'pending';
  verified: boolean;
  city?: string;
  county?: string;
}

@Component({
  selector: 'app-landlord-properties-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, MatIconModule, LandlordPropertiesAddUnitComponent],
  templateUrl: './list.html',
  styleUrls: ['./list.css']
})
export class LandlordPropertiesListComponent implements OnInit {
  private iconRegistry = inject(MatIconRegistry);
  private sanitizer = inject(DomSanitizer);

  kycNotApproved = false;

  allProperties: PropertyCard[] = [];
  filteredProperties: PropertyCard[] = [];
  loading = true;

  showAddUnitModal = false;
  selectedPropertyId = '';
  selectedPropertyName = '';

  viewMode: 'grid' | 'list' = 'grid';
  searchTerm = '';
  statusFilter = 'all';
  typeFilter = 'all';
  activeMenuId: string | null = null;

  page = 1;
  readonly pageSize = 12;

  statusOptions = [
    { value: 'all', label: 'All Statuses' },
    { value: 'active', label: 'Active' },
    { value: 'pending', label: 'Pending verification' }
  ];
  typeOptions = [
    { value: 'all', label: 'All Types' },
    { value: 'residential', label: 'Residential' },
    { value: 'commercial', label: 'Commercial' }
  ];

  constructor(
    private router: Router,
    private propertyService: PropertyService,
    private authService: AuthService
  ) {
    this.registerIcons();
  }

  private registerIcons(): void {
    const icons: Record<string, string> = {
      home: HomeIcon,
      building: BuildingIcon,
      banknote: BanknoteIcon,
      mail: MailIcon,
      unlock: UnlockIcon,
      refresh: RefreshCwIcon
    };
    Object.entries(icons).forEach(([name, svg]) => {
      this.iconRegistry.addSvgIconLiteral(name, this.sanitizer.bypassSecurityTrustHtml(svg));
    });
  }

  ngOnInit(): void {
    this.kycNotApproved = !this.authService.isLandlordKycApproved();
    this.authService.refreshToken().subscribe({
      next: () => { this.kycNotApproved = !this.authService.isLandlordKycApproved(); }
    });
    this.loadProperties();
    const savedView = localStorage.getItem('propertiesViewMode');
    if (savedView === 'list' || savedView === 'grid') this.viewMode = savedView;
  }

  loadProperties(): void {
    this.loading = true;
    this.propertyService.listProperties().subscribe({
      next: (properties) => {
        this.allProperties = properties.map(p => this.mapProperty(p));
        this.applyFilters();
        this.loading = false;
      },
      error: () => {
        this.allProperties = [];
        this.applyFilters();
        this.loading = false;
      }
    });
  }

  private mapProperty(p: PropertySummary): PropertyCard {
    const isCommercial = (p.propertyType || '').toLowerCase().includes('commercial');
    return {
      id: String(p.id),
      name: p.name,
      address: p.address || p.name,
      unitsCount: p.totalUnits || 0,
      occupiedCount: p.occupiedUnits || 0,
      vacantCount: p.vacantUnits || 0,
      monthlyRentRoll: p.monthlyRentRoll || 0,
      rentDueDay: p.rentDueDay,
      nextRentDueLabel: p.nextRentDueLabel,
      pendingInvites: p.pendingInvites || 0,
      type: isCommercial ? 'commercial' : 'residential',
      status: p.verified ? 'active' : 'pending',
      verified: p.verified,
      city: p.city,
      county: p.county
    };
  }

  applyFilters(): void {
    let filtered = [...this.allProperties];
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(p =>
        p.address.toLowerCase().includes(term) ||
        p.name.toLowerCase().includes(term) ||
        (p.city || '').toLowerCase().includes(term)
      );
    }
    if (this.statusFilter !== 'all') {
      filtered = filtered.filter(p => p.status === this.statusFilter);
    }
    if (this.typeFilter !== 'all') {
      filtered = filtered.filter(p => p.type === this.typeFilter);
    }
    this.filteredProperties = filtered;
    this.page = 1;
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.filteredProperties.length / this.pageSize));
  }

  get paginatedProperties(): PropertyCard[] {
    const start = (this.page - 1) * this.pageSize;
    return this.filteredProperties.slice(start, start + this.pageSize);
  }

  get showingFrom(): number {
    if (this.filteredProperties.length === 0) return 0;
    return (this.page - 1) * this.pageSize + 1;
  }

  get showingTo(): number {
    return Math.min(this.page * this.pageSize, this.filteredProperties.length);
  }

  get portalRoot(): '/landlord' | '/agent' {
    return this.router.url.startsWith('/agent') ? '/agent' : '/landlord';
  }

  propertyDetailLink(propertyId: string): string[] {
    return [`${this.portalRoot}/properties`, propertyId];
  }

  prevPage(): void {
    if (this.page > 1) this.page--;
  }

  nextPage(): void {
    if (this.page < this.totalPages) this.page++;
  }

  onSearchChange(): void { this.applyFilters(); }
  onStatusChange(): void { this.applyFilters(); }
  onTypeChange(): void { this.applyFilters(); }

  toggleMenu(propertyId: string): void {
    this.activeMenuId = this.activeMenuId === propertyId ? null : propertyId;
  }

  setViewMode(mode: 'grid' | 'list'): void {
    this.viewMode = mode;
    localStorage.setItem('propertiesViewMode', mode);
  }

  addProperty(): void {
    void this.router.navigate([`${this.portalRoot}/properties/add`]);
  }

  inviteTenant(propertyId?: string): void {
    void this.router.navigate([`${this.portalRoot}/tenants/invite`], {
      queryParams: propertyId ? { propertyId } : undefined
    });
  }

  viewPropertyDetails(propertyId: string, event?: Event): void {
    event?.preventDefault();
    event?.stopPropagation();
    const id = Number(propertyId);
    if (!propertyId || Number.isNaN(id)) return;
    void this.router.navigate(this.propertyDetailLink(propertyId));
  }

  openHouseHuntListings(propertyId: string): void {
    void this.router.navigate([`${this.portalRoot}/properties`, propertyId, 'house-hunt']);
  }

  addUnitToProperty(propertyId: string): void {
    const property = this.allProperties.find(p => p.id === propertyId);
    if (property) {
      this.selectedPropertyId = property.id;
      this.selectedPropertyName = property.name;
      this.showAddUnitModal = true;
    }
  }

  onUnitAdded(_unit: unknown): void {
    this.showAddUnitModal = false;
    this.loadProperties();
  }

  onCancelAddUnit(): void {
    this.showAddUnitModal = false;
    this.selectedPropertyId = '';
    this.selectedPropertyName = '';
  }

  getOccupancyPercent(occupied: number, total: number): number {
    if (total === 0) return 0;
    return (occupied / total) * 100;
  }

  getTypeIcon(type: string): string {
    return type === 'residential' ? 'home' : 'building';
  }

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'active': return 'badge-active';
      case 'pending': return 'badge-pending';
      default: return 'badge-pending';
    }
  }

  formatRentDue(day?: number): string {
    if (!day) return '1st of each month';
    const suffix = day >= 11 && day <= 13 ? 'th' :
      day % 10 === 1 ? 'st' : day % 10 === 2 ? 'nd' : day % 10 === 3 ? 'rd' : 'th';
    return `${day}${suffix} of month`;
  }

  get totalProperties(): number { return this.allProperties.length; }
  get totalUnits(): number { return this.allProperties.reduce((s, p) => s + p.unitsCount, 0); }
  get totalVacant(): number { return this.allProperties.reduce((s, p) => s + p.vacantCount, 0); }
  get totalPendingInvites(): number { return this.allProperties.reduce((s, p) => s + p.pendingInvites, 0); }
  get monthlyRentRoll(): number { return this.allProperties.reduce((s, p) => s + p.monthlyRentRoll, 0); }
  get occupancyRate(): number {
    const total = this.totalUnits;
    if (!total) return 0;
    const occupied = this.allProperties.reduce((s, p) => s + p.occupiedCount, 0);
    return (occupied / total) * 100;
  }
}

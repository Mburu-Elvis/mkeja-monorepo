import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule, MatIconRegistry } from '@angular/material/icon';
import { DomSanitizer } from '@angular/platform-browser';
import { AuthService, User } from '../../core/services/auth';
import { MpesaHeaderComponent } from '../../shared/components/header/header';

@Component({
  selector: 'app-tenant-sidebar-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule, MpesaHeaderComponent],
  templateUrl: './tenant-sidebar-layout.html',
  styleUrls: ['./tenant-sidebar-layout.css']
})
export class TenantSidebarLayoutComponent implements OnInit, OnDestroy {
  private iconRegistry = inject(MatIconRegistry);
  private sanitizer = inject(DomSanitizer);

  sidebarCollapsed = false;
  currentUser: User | null = null;
  currentTime = '';

  private clockInterval: ReturnType<typeof setInterval> | null = null;

  constructor(private authService: AuthService) {
    this.registerIcons();
    const saved = localStorage.getItem('tenantSidebarCollapsed');
    if (saved !== null) this.sidebarCollapsed = saved === 'true';
  }

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    this.updateClock();
    this.clockInterval = setInterval(() => this.updateClock(), 1000);
    if (this.authService.isAuthenticated()) {
      this.authService.refreshToken().subscribe({
        next: (res) => { this.currentUser = this.authService.getUserFromResponse(res); },
        error: () => {}
      });
    }
  }

  ngOnDestroy(): void {
    if (this.clockInterval) clearInterval(this.clockInterval);
  }

  toggleSidebar(): void {
    this.sidebarCollapsed = !this.sidebarCollapsed;
    localStorage.setItem('tenantSidebarCollapsed', String(this.sidebarCollapsed));
  }

  logout(): void {
    this.authService.logout();
  }

  get userInitials(): string {
    const name = this.currentUser?.fullName || 'Tenant';
    const parts = name.trim().split(/\s+/);
    return parts.length >= 2
      ? (parts[0][0] + parts[1][0]).toUpperCase()
      : name.substring(0, 2).toUpperCase();
  }

  get userEmail(): string {
    return this.currentUser?.email || this.currentUser?.phone || '';
  }

  private updateClock(): void {
    this.currentTime = new Date().toLocaleTimeString('en-KE', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  }

  private registerIcons(): void {
    const icons = ['building', 'wallet', 'creditCard', 'zap', 'pieChart', 'user', 'help', 'shield', 'search', 'chevronLeft', 'chevronRight', 'signal', 'wifi', 'battery', 'logout'];
    icons.forEach(icon => {
      this.iconRegistry.addSvgIconLiteral(icon, this.sanitizer.bypassSecurityTrustHtml(this.getIconSvg(icon)));
    });
  }

  private getIconSvg(name: string): string {
    const icons: Record<string, string> = {
      building: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>',
      wallet: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12V8H4V12M20 12V16H4V12M20 12H22M2 12H4M12 12H12.01M16 12H16.01M17 16H7M20 8C20 6.9 19.1 6 18 6H6C4.9 6 4 6.9 4 8"/></svg>',
      creditCard: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>',
      zap: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>',
      pieChart: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21.21 15.89A10 10 0 1 1 8 2.83"/><path d="M22 12A10 10 0 0 0 12 2v10z"/></svg>',
      user: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>',
      help: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
      shield: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>',
      search: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>',
      chevronLeft: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>',
      chevronRight: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>',
      signal: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 20h.01"/><path d="M7 20v-4"/><path d="M12 20v-8"/><path d="M17 20V8"/><path d="M22 4v16"/></svg>',
      wifi: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12.55a11 11 0 0 1 14.08 0"/><path d="M1.42 9a16 16 0 0 1 21.16 0"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><line x1="12" y1="20" x2="12.01" y2="20"/></svg>',
      battery: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="1" y="6" width="18" height="12" rx="2"/><line x1="23" y1="10" x2="23" y2="14"/></svg>',
      logout: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>'
    };
    return icons[name] || '';
  }
}

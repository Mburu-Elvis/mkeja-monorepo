import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule, MatIconRegistry } from '@angular/material/icon';
import { DomSanitizer } from '@angular/platform-browser';
import { AuthService, User } from '../../core/services/auth';
import { MpesaHeaderComponent } from '../../shared/components/header/header';
import { AGENT_FUNCTION_GROUPS } from '../../features/agent/agent-functions';

interface SidebarLink {
  label: string;
  route: string;
  icon: string;
}

interface SidebarSection {
  title: string;
  links: SidebarLink[];
}

@Component({
  selector: 'app-agent-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule, MpesaHeaderComponent],
  templateUrl: './agent-layout.html',
  styleUrls: ['./agent-layout.css']
})
export class AgentLayoutComponent implements OnInit, OnDestroy {
  private iconRegistry = inject(MatIconRegistry);
  private sanitizer = inject(DomSanitizer);

  sidebarCollapsed = false;
  currentUser: User | null = null;
  currentTime = '';
  readonly sidebarSections: SidebarSection[] = this.buildSidebarSections();

  private clockInterval: ReturnType<typeof setInterval> | null = null;

  constructor(private authService: AuthService) {
    this.registerIcons();
    const saved = localStorage.getItem('agentSidebarCollapsed');
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
    localStorage.setItem('agentSidebarCollapsed', String(this.sidebarCollapsed));
  }

  logout(): void {
    this.authService.logout();
  }

  get userInitials(): string {
    const name = this.currentUser?.fullName || 'Agent';
    const parts = name.trim().split(/\s+/);
    return parts.length >= 2
      ? (parts[0][0] + parts[1][0]).toUpperCase()
      : name.substring(0, 2).toUpperCase();
  }

  get userEmail(): string {
    return this.currentUser?.email || this.currentUser?.phone || '';
  }

  private buildSidebarSections(): SidebarSection[] {
    const routeIcons: Record<string, string> = {
      '/agent/properties': 'building',
      '/agent/leads': 'search',
      '/agent/tenants/invite': 'clipboard',
      '/agent/tenants': 'users',
      '/agent/remittances': 'creditCard',
      '/agent/remittances/statement': 'pieChart'
    };

    return AGENT_FUNCTION_GROUPS.map((group) => ({
      title: group.title,
      links: group.functions
        .filter((fn) => fn.status === 'live' && fn.route)
        .map((fn) => ({
          label: fn.label,
          route: fn.route!,
          icon: routeIcons[fn.route!] || group.icon
        }))
    })).filter((section) => section.links.length > 0);
  }

  private updateClock(): void {
    this.currentTime = new Date().toLocaleTimeString('en-KE', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  }

  private registerIcons(): void {
    const icons = ['home', 'building', 'users', 'creditCard', 'pieChart', 'user', 'search', 'clipboard', 'wrench', 'chart', 'clock', 'help', 'chevronLeft', 'chevronRight', 'signal', 'wifi', 'battery', 'logout'];
    icons.forEach(icon => {
      this.iconRegistry.addSvgIconLiteral(icon, this.sanitizer.bypassSecurityTrustHtml(this.getIconSvg(icon)));
    });
  }

  private getIconSvg(name: string): string {
    const icons: Record<string, string> = {
      home: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>',
      building: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>',
      users: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
      creditCard: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>',
      pieChart: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21.21 15.89A10 10 0 1 1 8 2.83"/><path d="M22 12A10 10 0 0 0 12 2v10z"/></svg>',
      user: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>',
      search: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>',
      clipboard: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1"/></svg>',
      wrench: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>',
      chart: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>',
      clock: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>',
      help: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
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

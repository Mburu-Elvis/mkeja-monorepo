import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { MatIconModule, MatIconRegistry } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DomSanitizer } from '@angular/platform-browser';
import { AuthService, User } from '../../../core/services/auth';
import { AGENT_FUNCTION_GROUPS, AgentFunction, AgentFunctionGroup } from '../agent-functions';

@Component({
  selector: 'app-agent-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.css']
})
export class AgentDashboardComponent implements OnInit {
  private iconRegistry = inject(MatIconRegistry);
  private sanitizer = inject(DomSanitizer);
  private authService = inject(AuthService);
  private route = inject(ActivatedRoute);
  private snackBar = inject(MatSnackBar);
  private cdr = inject(ChangeDetectorRef);

  readonly groups = AGENT_FUNCTION_GROUPS;
  currentUser: User | null = null;
  kycPending = false;
  kycRejected = false;

  constructor() {
    const icons: Record<string, string> = {
      building: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>',
      users: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>',
      clipboard: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1"/></svg>',
      creditCard: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>',
      wrench: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>',
      pieChart: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21.21 15.89A10 10 0 1 1 8 2.83"/><path d="M22 12A10 10 0 0 0 12 2v10z"/></svg>',
      chart: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>',
      help: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>'
    };
    Object.entries(icons).forEach(([name, svg]) => {
      this.iconRegistry.addSvgIconLiteral(name, this.sanitizer.bypassSecurityTrustHtml(svg));
    });
  }

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    this.applyKycFlags(this.currentUser);
    this.authService.refreshToken().subscribe({
      next: (res) => {
        this.currentUser = this.authService.getUserFromResponse(res);
        this.applyKycFlags(this.currentUser);
        this.cdr.markForCheck();
      }
    });
    this.route.queryParams.subscribe(params => {
      if (params['kyc'] === 'required') {
        this.snackBar.open(
          'Complete KYC verification before managing properties, units, or inviting tenants.',
          'Close',
          { duration: 6000 }
        );
      }
    });
  }

  private applyKycFlags(user: User | null): void {
    this.kycPending = user?.kycStatus === 'PENDING' || user?.kycStatus === 'MANUAL_REVIEW';
    this.kycRejected = user?.kycStatus === 'REJECTED';
  }

  get kycApproved(): boolean {
    return this.authService.isLandlordKycApproved();
  }

  isFunctionAccessible(fn: AgentFunction): boolean {
    if (fn.status !== 'live' || !fn.route) {
      return false;
    }
    if (fn.requiresKyc !== false && !this.kycApproved) {
      return false;
    }
    return true;
  }

  liveCount(group: AgentFunctionGroup): number {
    return group.functions.filter((fn) => this.isFunctionAccessible(fn)).length;
  }

  trackFunction(fn: AgentFunction): string {
    return fn.id;
  }

  trackGroup(group: AgentFunctionGroup): string {
    return group.id;
  }
}

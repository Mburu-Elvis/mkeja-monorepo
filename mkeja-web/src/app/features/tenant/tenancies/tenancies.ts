import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TenantTenancyService } from '../../../core/services/tenant-tenancy.service';
import { TenantTenancyItem } from '../../../core/services/landlord.service';
import { DEMO_TENANCY_LABEL, demoTenantTenancyHistory } from '../../../shared/data/demo-tenancy-history';

export type TenancyTimelineNode =
  | { kind: 'tenancy'; item: TenantTenancyItem }
  | {
      kind: 'move';
      fromProperty: string;
      toProperty: string;
      moveDate: Date;
    }
  | {
      kind: 'gap';
      startDate: Date;
      endDate: Date;
      dayCount: number;
    };

@Component({
  selector: 'app-tenant-tenancies',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './tenancies.html',
  styleUrls: ['./tenancies.css']
})
export class TenantTenanciesComponent implements OnInit {
  loading = true;
  tenancies: TenantTenancyItem[] = [];
  timeline: TenancyTimelineNode[] = [];
  usingDemoData = false;
  readonly demoLabel = DEMO_TENANCY_LABEL;

  /** Days between tenancies before we treat it as time off-platform. */
  private readonly gapThresholdDays = 14;

  constructor(private tenantTenancyService: TenantTenancyService) {}

  ngOnInit(): void {
    this.tenantTenancyService.getTenancyHistory().subscribe({
      next: (res) => {
        if (!res.tenancies?.length) {
          this.tenancies = demoTenantTenancyHistory();
          this.usingDemoData = true;
        } else {
          this.tenancies = res.tenancies;
          this.usingDemoData = false;
        }
        this.timeline = this.buildTimeline(this.tenancies);
        this.loading = false;
      },
      error: () => {
        this.tenancies = demoTenantTenancyHistory();
        this.usingDemoData = true;
        this.timeline = this.buildTimeline(this.tenancies);
        this.loading = false;
      }
    });
  }

  get summaryStats(): { homes: number; gapCount: number; activeLabel: string } {
    const gaps = this.timeline.filter((n) => n.kind === 'gap').length;
    const active = this.tenancies.find((t) => (t.status || '').toUpperCase() === 'ACTIVE');
    return {
      homes: this.tenancies.length,
      gapCount: gaps,
      activeLabel: active ? this.propertyLabel(active) : 'None'
    };
  }

  locationLabel(item: TenantTenancyItem): string {
    const parts: string[] = [];
    if (item.wing) parts.push(item.wing);
    if (item.floorNumber != null) parts.push(`Floor ${item.floorNumber}`);
    return parts.length ? parts.join(' · ') : '—';
  }

  propertyLabel(item: TenantTenancyItem): string {
    const name = item.propertyName?.trim();
    if (name) return name;
    if (item.propertyAddress) return item.propertyAddress;
    return 'Property';
  }

  statusClass(status: string): string {
    switch ((status || '').toUpperCase()) {
      case 'ACTIVE':
        return 'active';
      case 'TERMINATED':
      case 'EXPIRED':
        return 'ended';
      case 'PENDING':
        return 'pending';
      default:
        return 'info';
    }
  }

  formatDate(value?: string | Date): string {
    if (!value) return '—';
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) return '—';
    return date.toLocaleDateString('en-KE', { year: 'numeric', month: 'short', day: 'numeric' });
  }

  tenancyPeriod(item: TenantTenancyItem): string {
    const start = this.formatDate(item.moveInDate || item.leaseStartDate);
    const isActive = (item.status || '').toUpperCase() === 'ACTIVE';
    const end = isActive ? 'Present' : this.formatDate(item.moveOutDate || item.leaseEndDate);
    return `${start} — ${end}`;
  }

  trackNode(index: number, node: TenancyTimelineNode): string | number {
    if (node.kind === 'tenancy') return node.item.tenancyId;
    if (node.kind === 'move') return `move-${index}-${node.fromProperty}-${node.toProperty}`;
    return `gap-${index}-${node.startDate.getTime()}`;
  }

  gapDurationLabel(dayCount: number): string {
    if (dayCount < 30) return `${dayCount} days`;
    const months = Math.round(dayCount / 30);
    if (months < 12) return months === 1 ? '1 month' : `${months} months`;
    const years = Math.floor(months / 12);
    const rem = months % 12;
    if (rem === 0) return years === 1 ? '1 year' : `${years} years`;
    return `${years}y ${rem}m`;
  }

  private buildTimeline(items: TenantTenancyItem[]): TenancyTimelineNode[] {
    if (!items.length) return [];

    const sorted = [...items].sort(
      (a, b) => this.tenancyStart(b).getTime() - this.tenancyStart(a).getTime()
    );

    const nodes: TenancyTimelineNode[] = [];

    for (let i = 0; i < sorted.length; i++) {
      nodes.push({ kind: 'tenancy', item: sorted[i] });

      if (i >= sorted.length - 1) continue;

      const newer = sorted[i];
      const older = sorted[i + 1];
      const olderEnd = this.tenancyEnd(older);
      const newerStart = this.tenancyStart(newer);

      if (!olderEnd || !newerStart) continue;

      const gapDays = this.daysBetween(olderEnd, newerStart);

      if (gapDays > this.gapThresholdDays) {
        const gapStart = this.addDays(olderEnd, 1);
        const gapEnd = this.addDays(newerStart, -1);
        nodes.push({
          kind: 'gap',
          startDate: gapStart,
          endDate: gapEnd,
          dayCount: gapDays
        });
      } else if (this.propertyLabel(older) !== this.propertyLabel(newer)) {
        nodes.push({
          kind: 'move',
          fromProperty: this.propertyLabel(older),
          toProperty: this.propertyLabel(newer),
          moveDate: newerStart
        });
      }
    }

    return nodes;
  }

  private tenancyStart(item: TenantTenancyItem): Date {
    return this.parseDate(item.moveInDate || item.leaseStartDate) ?? new Date(0);
  }

  private tenancyEnd(item: TenantTenancyItem): Date | null {
    if ((item.status || '').toUpperCase() === 'ACTIVE') {
      return this.parseDate(item.moveOutDate || item.leaseEndDate);
    }
    return this.parseDate(item.moveOutDate || item.leaseEndDate || item.leaseStartDate);
  }

  private parseDate(value?: string): Date | null {
    if (!value) return null;
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  private daysBetween(from: Date, to: Date): number {
    const ms = to.getTime() - from.getTime();
    return Math.max(0, Math.floor(ms / (1000 * 60 * 60 * 24)));
  }

  private addDays(date: Date, days: number): Date {
    const next = new Date(date);
    next.setDate(next.getDate() + days);
    return next;
  }
}

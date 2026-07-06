import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatIconModule, MatIconRegistry } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, Router } from '@angular/router';
import { DomSanitizer } from '@angular/platform-browser';
import {
  SupportPortal,
  SupportService,
  SupportTicket,
  SupportTicketPriority
} from '../../../core/services/support.service';
import {
  SupportFaqItem,
  SupportPortalConfig,
  detectSupportPortalFromUrl,
  getSupportPortalConfig
} from '../../../shared/data/support-portal-config';
import { registerSupportIcons } from './support-icons';

@Component({
  selector: 'app-support',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, MatIconModule],
  templateUrl: './support.html',
  styleUrls: ['./support.css']
})
export class SupportComponent implements OnInit {
  private fb = inject(FormBuilder);
  private snackBar = inject(MatSnackBar);
  private supportService = inject(SupportService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private iconRegistry = inject(MatIconRegistry);
  private sanitizer = inject(DomSanitizer);

  portal: SupportPortal = 'tenant';
  portalConfig!: SupportPortalConfig;

  activeTab: 'new' | 'my-tickets' | 'faq' = 'new';
  selectedCategory = '';
  tickets: SupportTicket[] = [];
  selectedTicket: SupportTicket | null = null;
  isLoading = false;
  loadingTickets = true;
  expandedFaqIds = new Set<number>();

  ticketForm: FormGroup;
  replyForm: FormGroup;

  get activeTicketCount(): number {
    return this.tickets.filter((ticket) => ticket.status === 'open' || ticket.status === 'in-progress').length;
  }

  constructor() {
    registerSupportIcons(this.iconRegistry, this.sanitizer);

    this.ticketForm = this.fb.group({
      subject: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(100)]],
      category: ['', Validators.required],
      priority: ['medium' as SupportTicketPriority, Validators.required],
      description: ['', [Validators.required, Validators.minLength(20), Validators.maxLength(2000)]]
    });

    this.replyForm = this.fb.group({
      message: ['', [Validators.required, Validators.minLength(5)]]
    });
  }

  ngOnInit(): void {
    this.portal = (this.route.snapshot.data['supportPortal'] as SupportPortal)
      || detectSupportPortalFromUrl(this.router.url);
    this.portalConfig = getSupportPortalConfig(this.portal);
    this.selectedCategory = this.portalConfig.faqCategories[0]?.id || 'payment';
    this.loadTickets();
  }

  loadTickets(): void {
    this.loadingTickets = true;
    this.supportService.getTickets().subscribe({
      next: (tickets) => {
        this.tickets = tickets;
        this.loadingTickets = false;
      },
      error: () => {
        this.tickets = [];
        this.loadingTickets = false;
      }
    });
  }

  submitTicket(): void {
    if (this.ticketForm.invalid) {
      this.ticketForm.markAllAsTouched();
      this.snackBar.open('Please fill all required fields correctly', 'Close', { duration: 3000 });
      return;
    }

    this.isLoading = true;
    const value = this.ticketForm.value;

    this.supportService.createTicket({
      subject: value.subject,
      category: value.category,
      priority: value.priority,
      description: value.description
    }).subscribe({
      next: (ticket) => {
        this.tickets = [ticket, ...this.tickets.filter((item) => item.id !== ticket.id)];
        this.ticketForm.reset({ priority: 'medium' });
        this.activeTab = 'my-tickets';
        this.isLoading = false;
        this.snackBar.open('Ticket submitted successfully. We will respond within 2 business hours.', 'Close', { duration: 5000 });
      },
      error: (err) => {
        this.isLoading = false;
        this.snackBar.open(err.message || 'Failed to submit ticket', 'Close', { duration: 4000 });
      }
    });
  }

  viewTicket(ticket: SupportTicket): void {
    this.selectedTicket = ticket;
  }

  closeTicketView(): void {
    this.selectedTicket = null;
    this.replyForm.reset();
  }

  sendReply(): void {
    if (this.replyForm.invalid || !this.selectedTicket) {
      return;
    }

    this.isLoading = true;
    const message = this.replyForm.value.message;

    this.supportService.replyToTicket(this.selectedTicket.id, message).subscribe({
      next: (updated) => {
        this.selectedTicket = updated;
        this.tickets = this.tickets.map((ticket) => (ticket.id === updated.id ? updated : ticket));
        this.replyForm.reset();
        this.isLoading = false;
        this.snackBar.open('Reply sent successfully', 'Close', { duration: 2000 });
      },
      error: (err) => {
        this.isLoading = false;
        this.snackBar.open(err.message || 'Failed to send reply', 'Close', { duration: 4000 });
      }
    });
  }

  toggleFaq(faq: SupportFaqItem): void {
    if (this.expandedFaqIds.has(faq.id)) {
      this.expandedFaqIds.delete(faq.id);
    } else {
      this.expandedFaqIds.add(faq.id);
    }
  }

  isFaqExpanded(faq: SupportFaqItem): boolean {
    return this.expandedFaqIds.has(faq.id);
  }

  getFaqsByCategory(categoryId: string): SupportFaqItem[] {
    return this.portalConfig.faqs.filter((faq) => faq.category === categoryId);
  }

  getPriorityColor(priority: string): string {
    switch (priority) {
      case 'urgent': return 'priority-urgent';
      case 'high': return 'priority-high';
      case 'medium': return 'priority-medium';
      case 'low': return 'priority-low';
      default: return 'priority-medium';
    }
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'open': return 'status-open';
      case 'in-progress': return 'status-progress';
      case 'resolved': return 'status-resolved';
      case 'closed': return 'status-closed';
      default: return 'status-open';
    }
  }

  getCategoryIcon(category: string): string {
    switch (category) {
      case 'payment': return 'banknote';
      case 'fuliza': return 'zap';
      case 'ratiba': return 'calendar';
      case 'account': return 'user';
      case 'technical': return 'settings';
      case 'properties': return 'building';
      case 'tenants': return 'users';
      case 'remittances': return 'creditCard';
      case 'leads': return 'search';
      case 'kyc': return 'shield';
      default: return 'help';
    }
  }

  formatDate(value?: string | Date): string {
    if (!value) return '—';
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) return '—';
    return date.toLocaleDateString('en-KE', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  formatRelativeTime(value?: string | Date): string {
    if (!value) return '—';
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) return '—';

    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    return 'Just now';
  }

  getCategoryName(category: string): string {
    const match = this.portalConfig.categories.find((item) => item.value === category);
    if (match) return match.label;

    const labels: Record<string, string> = {
      payment: 'Payment Issue',
      fuliza: 'Rent Fuliza',
      ratiba: 'Auto-Deductions',
      account: 'Account & KYC',
      technical: 'Technical Issue',
      properties: 'Properties & Units',
      tenants: 'Tenants & Invitations',
      remittances: 'Remittances & Payouts',
      leads: 'House Hunt Leads',
      kyc: 'KYC & Verification',
      other: 'Other'
    };
    return labels[category] || category;
  }

  getPriorityName(priority: string): string {
    const priorities: Record<string, string> = {
      low: 'Low',
      medium: 'Medium',
      high: 'High',
      urgent: 'Urgent'
    };
    return priorities[priority] || priority;
  }

  getStatusName(status: string): string {
    const statuses: Record<string, string> = {
      open: 'Open',
      'in-progress': 'In Progress',
      resolved: 'Resolved',
      closed: 'Closed'
    };
    return statuses[status] || status;
  }
}

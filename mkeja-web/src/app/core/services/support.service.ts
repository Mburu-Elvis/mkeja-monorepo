import { Injectable } from '@angular/core';
import { Observable, catchError, map, of, throwError } from 'rxjs';
import { HttpService } from './http';
import { getStorageItem, setStorageItem } from '../utils/storage';
import { AuthService } from './auth';

export type SupportPortal = 'tenant' | 'landlord' | 'agent';

export type SupportTicketCategory =
  | 'payment'
  | 'fuliza'
  | 'ratiba'
  | 'account'
  | 'technical'
  | 'properties'
  | 'tenants'
  | 'remittances'
  | 'leads'
  | 'kyc'
  | 'other';

export type SupportTicketPriority = 'low' | 'medium' | 'high' | 'urgent';
export type SupportTicketStatus = 'open' | 'in-progress' | 'resolved' | 'closed';

export interface SupportTicketMessage {
  id: number | string;
  message: string;
  fromUser: boolean;
  authorName?: string;
  createdAt: string;
}

export interface SupportTicket {
  id: number | string;
  referenceCode: string;
  subject: string;
  category: SupportTicketCategory | string;
  priority: SupportTicketPriority;
  description: string;
  status: SupportTicketStatus;
  createdAt: string;
  updatedAt: string;
  messages: SupportTicketMessage[];
}

export interface CreateSupportTicketPayload {
  subject: string;
  category: string;
  priority: SupportTicketPriority;
  description: string;
}

interface ApiSupportTicketList {
  tickets: ApiSupportTicket[];
}

interface ApiSupportTicket {
  id: number;
  referenceCode: string;
  subject: string;
  category: string;
  priority: string;
  status: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  messages: ApiSupportTicketMessage[];
}

interface ApiSupportTicketMessage {
  id: number;
  message: string;
  fromUser: boolean;
  authorName?: string;
  createdAt: string;
}

@Injectable({ providedIn: 'root' })
export class SupportService {
  constructor(
    private http: HttpService,
    private auth: AuthService
  ) {}

  getTickets(): Observable<SupportTicket[]> {
    return this.http.get<ApiSupportTicketList>('/support/tickets').pipe(
      map((res) => (res.tickets || []).map((ticket) => this.mapTicket(ticket))),
      catchError(() => of(this.readLocalTickets().map((ticket) => this.mapTicket(ticket))))
    );
  }

  createTicket(payload: CreateSupportTicketPayload): Observable<SupportTicket> {
    const body = {
      subject: payload.subject,
      category: payload.category,
      priority: payload.priority.toUpperCase(),
      description: payload.description
    };

    return this.http.post<ApiSupportTicket>('/support/tickets', body).pipe(
      map((ticket) => this.mapTicket(ticket)),
      catchError(() => of(this.mapTicket(this.createLocalTicket(payload))))
    );
  }

  replyToTicket(ticketId: number | string, message: string): Observable<SupportTicket> {
    const numericId = typeof ticketId === 'number' ? ticketId : Number(ticketId);

    if (!Number.isFinite(numericId)) {
      const updated = this.replyLocalTicket(String(ticketId), message);
      return updated ? of(updated) : throwError(() => new Error('Ticket not found'));
    }

    return this.http.post<ApiSupportTicket>(`/support/tickets/${numericId}/replies`, { message }).pipe(
      map((ticket) => this.mapTicket(ticket)),
      catchError(() => {
        const updated = this.replyLocalTicket(String(ticketId), message);
        return updated ? of(updated) : throwError(() => new Error('Ticket not found'));
      })
    );
  }

  private mapTicket(ticket: ApiSupportTicket): SupportTicket {
    return {
      id: ticket.id,
      referenceCode: ticket.referenceCode,
      subject: ticket.subject,
      category: ticket.category,
      priority: ticket.priority.toLowerCase() as SupportTicketPriority,
      description: ticket.description,
      status: this.mapStatus(ticket.status),
      createdAt: ticket.createdAt,
      updatedAt: ticket.updatedAt,
      messages: (ticket.messages || []).map((message) => ({
        id: message.id,
        message: message.message,
        fromUser: message.fromUser,
        authorName: message.authorName,
        createdAt: message.createdAt
      }))
    };
  }

  private mapStatus(status: string): SupportTicketStatus {
    switch ((status || '').toUpperCase()) {
      case 'IN_PROGRESS':
        return 'in-progress';
      case 'RESOLVED':
        return 'resolved';
      case 'CLOSED':
        return 'closed';
      default:
        return 'open';
    }
  }

  private storageKey(): string {
    const user = this.auth.getCurrentUser();
    const userId = user?.id || 'anonymous';
    const role = user?.role || 'unknown';
    return `mkeja_support_tickets_${role}_${userId}`;
  }

  private readLocalTickets(): ApiSupportTicket[] {
    const raw = getStorageItem(this.storageKey());
    if (!raw) return [];
    try {
      return JSON.parse(raw) as ApiSupportTicket[];
    } catch {
      return [];
    }
  }

  private writeLocalTickets(tickets: ApiSupportTicket[]): void {
    setStorageItem(this.storageKey(), JSON.stringify(tickets));
  }

  private createLocalTicket(payload: CreateSupportTicketPayload): ApiSupportTicket {
    const now = new Date().toISOString();
    const existing = this.readLocalTickets();
    const ticket: ApiSupportTicket = {
      id: Date.now(),
      referenceCode: `TKT-${String(existing.length + 1).padStart(3, '0')}`,
      subject: payload.subject,
      category: payload.category,
      priority: payload.priority.toUpperCase(),
      status: 'OPEN',
      description: payload.description,
      createdAt: now,
      updatedAt: now,
      messages: [
        {
          id: Date.now(),
          message: payload.description,
          fromUser: true,
          authorName: this.auth.getCurrentUser()?.fullName,
          createdAt: now
        },
        {
          id: Date.now() + 1,
          message: 'Thanks for contacting Mkeja Support. We have received your ticket and will respond within 2 business hours.',
          fromUser: false,
          authorName: 'Mkeja Support',
          createdAt: now
        }
      ]
    };
    this.writeLocalTickets([ticket, ...existing]);
    return ticket;
  }

  private replyLocalTicket(ticketRef: string, message: string): SupportTicket | null {
    const tickets = this.readLocalTickets();
    const index = tickets.findIndex((ticket) => String(ticket.id) === ticketRef || ticket.referenceCode === ticketRef);
    if (index < 0) return null;

    const now = new Date().toISOString();
    const ticket = tickets[index];
    ticket.messages = [
      ...ticket.messages,
      {
        id: Date.now(),
        message,
        fromUser: true,
        authorName: this.auth.getCurrentUser()?.fullName,
        createdAt: now
      }
    ];
    ticket.updatedAt = now;
    if (ticket.status === 'IN_PROGRESS' || ticket.status === 'RESOLVED') {
      ticket.status = 'IN_PROGRESS';
    }
    tickets[index] = ticket;
    this.writeLocalTickets(tickets);
    return this.mapTicket(ticket);
  }
}

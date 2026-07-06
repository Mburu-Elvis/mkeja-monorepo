import { Injectable, OnDestroy } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { HttpService } from './http';
import { getStorageItem } from '../utils/storage';

export interface AppNotification {
  id: number;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  category: string;
  read: boolean;
  link?: string;
  createdAt: string;
}

export interface UnreadCount {
  count: number;
}

interface RealtimeMessage {
  type: 'NOTIFICATION' | 'UNREAD_COUNT';
  payload: AppNotification | UnreadCount;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService implements OnDestroy {
  private readonly basePath = '/notifications';
  private readonly realtimeSubject = new Subject<AppNotification>();
  private readonly unreadCountSubject = new Subject<number>();

  private socket: WebSocket | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private pingTimer: ReturnType<typeof setInterval> | null = null;
  private reconnectAttempts = 0;
  private shouldConnect = false;

  readonly realtime$ = this.realtimeSubject.asObservable();
  readonly unreadCount$ = this.unreadCountSubject.asObservable();

  constructor(private http: HttpService) {}

  ngOnDestroy(): void {
    this.disconnectRealtime();
  }

  list(): Observable<AppNotification[]> {
    return this.http.get<AppNotification[]>(this.basePath);
  }

  unreadCount(): Observable<UnreadCount> {
    return this.http.get<UnreadCount>(`${this.basePath}/unread-count`);
  }

  markRead(id: number): Observable<AppNotification> {
    return this.http.patch<AppNotification>(`${this.basePath}/${id}/read`, {});
  }

  markAllRead(): Observable<{ message: string }> {
    return this.http.patch<{ message: string }>(`${this.basePath}/read-all`, {});
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.basePath}/${id}`);
  }

  clearAll(): Observable<void> {
    return this.http.delete<void>(this.basePath);
  }

  registerPushDevice(token: string, platform: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.basePath}/devices`, { token, platform });
  }

  connectRealtime(): void {
    const token = getStorageItem('access_token');
    if (!token) {
      return;
    }

    this.shouldConnect = true;
    this.openSocket(token);
  }

  disconnectRealtime(): void {
    this.shouldConnect = false;
    this.reconnectAttempts = 0;

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.pingTimer) {
      clearInterval(this.pingTimer);
      this.pingTimer = null;
    }

    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
  }

  private openSocket(token: string): void {
    if (this.socket && (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING)) {
      return;
    }

    const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
    const url = `${protocol}://${window.location.host}/ws/notifications?token=${encodeURIComponent(token)}`;
    this.socket = new WebSocket(url);

    this.socket.onopen = () => {
      this.reconnectAttempts = 0;
      this.startPing();
    };

    this.socket.onmessage = (event) => {
      this.handleRealtimeMessage(event.data);
    };

    this.socket.onclose = () => {
      this.stopPing();
      this.socket = null;
      this.scheduleReconnect(token);
    };

    this.socket.onerror = () => {
      this.socket?.close();
    };
  }

  private handleRealtimeMessage(raw: string): void {
    if (raw === 'PONG') {
      return;
    }

    try {
      const message = JSON.parse(raw) as RealtimeMessage;
      if (message.type === 'NOTIFICATION') {
        this.realtimeSubject.next(message.payload as AppNotification);
      } else if (message.type === 'UNREAD_COUNT') {
        const count = (message.payload as UnreadCount).count;
        this.unreadCountSubject.next(count);
      }
    } catch {
      // Ignore malformed frames
    }
  }

  private startPing(): void {
    this.stopPing();
    this.pingTimer = setInterval(() => {
      if (this.socket?.readyState === WebSocket.OPEN) {
        this.socket.send('PING');
      }
    }, 30000);
  }

  private stopPing(): void {
    if (this.pingTimer) {
      clearInterval(this.pingTimer);
      this.pingTimer = null;
    }
  }

  private scheduleReconnect(token: string): void {
    if (!this.shouldConnect) {
      return;
    }

    const delay = Math.min(30000, 1000 * Math.pow(2, this.reconnectAttempts));
    this.reconnectAttempts += 1;

    this.reconnectTimer = setTimeout(() => {
      const latestToken = getStorageItem('access_token');
      if (latestToken && this.shouldConnect) {
        this.openSocket(latestToken);
      }
    }, delay);
  }
}

import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatIconModule, MatIconRegistry } from '@angular/material/icon';
import { DomSanitizer } from '@angular/platform-browser';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subscription } from 'rxjs';
import { NotificationService, AppNotification } from '../../../core/services/notification.service';
import { registerHeaderIcons } from '../../../shared/components/header/header-icons';

@Component({
  selector: 'app-notifications-inbox',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: './inbox.html',
  styleUrls: ['./inbox.css']
})
export class NotificationsInboxComponent implements OnInit, OnDestroy {
  private notificationService = inject(NotificationService);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);
  private iconRegistry = inject(MatIconRegistry);
  private sanitizer = inject(DomSanitizer);

  loading = true;
  notifications: AppNotification[] = [];
  private realtimeSub?: Subscription;

  constructor() {
    registerHeaderIcons(this.iconRegistry, this.sanitizer);
  }

  ngOnInit(): void {
    this.loadNotifications();
    this.notificationService.connectRealtime();
    this.realtimeSub = this.notificationService.realtime$.subscribe((item) => {
      this.notifications = [
        item,
        ...this.notifications.filter((existing) => existing.id !== item.id)
      ];
    });
  }

  ngOnDestroy(): void {
    this.realtimeSub?.unsubscribe();
  }

  get unreadCount(): number {
    return this.notifications.filter((n) => !n.read).length;
  }

  loadNotifications(): void {
    this.loading = true;
    this.notificationService.list().subscribe({
      next: (items) => {
        this.notifications = items;
        this.loading = false;
      },
      error: () => {
        this.notifications = [];
        this.loading = false;
      }
    });
  }

  markAsRead(notification: AppNotification): void {
    if (notification.read) {
      if (notification.link) {
        this.router.navigateByUrl(notification.link);
      }
      return;
    }

    this.notificationService.markRead(notification.id).subscribe({
      next: (updated) => {
        notification.read = updated.read;
        if (notification.link) {
          this.router.navigateByUrl(notification.link);
        }
      }
    });
  }

  markAllAsRead(): void {
    this.notificationService.markAllRead().subscribe({
      next: () => {
        this.notifications.forEach((n) => (n.read = true));
        this.snackBar.open('All notifications marked as read', 'Close', { duration: 2000 });
      }
    });
  }

  clearAll(): void {
    this.notificationService.clearAll().subscribe({
      next: () => {
        this.notifications = [];
        this.snackBar.open('All notifications cleared', 'Close', { duration: 2000 });
      }
    });
  }

  getNotificationIcon(type: string): string {
    switch (type) {
      case 'success':
        return 'check-circle';
      case 'error':
        return 'alert-circle';
      case 'warning':
        return 'alert-triangle';
      default:
        return 'info';
    }
  }

  getTimeAgo(date: string): string {
    const now = new Date();
    const created = new Date(date);
    const diff = now.getTime() - created.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return created.toLocaleDateString();
  }
}

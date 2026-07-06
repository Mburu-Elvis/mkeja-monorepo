// components/header/header.component.ts
import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';
import { MatBadgeModule } from '@angular/material/badge';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconRegistry } from '@angular/material/icon';
import { DomSanitizer } from '@angular/platform-browser';
import { AuthService } from '../../../core/services/auth';
import { NotificationService, AppNotification } from '../../../core/services/notification.service';
import { registerHeaderIcons } from './header-icons';

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  read: boolean;
  createdAt: Date;
  link?: string;
}

export interface UserMenuOption {
  label: string;
  icon: string;
  action: string;
  divider?: boolean;
}

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    CommonModule, 
    RouterModule, 
    MatIconModule, 
    MatTooltipModule, 
    MatMenuModule,
    MatBadgeModule,
    MatDividerModule
  ],
  templateUrl: './header.html',
  styleUrls: ['./header.css']
})
export class MpesaHeaderComponent implements OnInit, OnDestroy {
  @Input() userName: string = 'Guest';
  @Input() userAvatar: string = '';
  @Input() userEmail: string = '';
  @Input() userRoleLabel: string = 'Tenant';
  @Input() profileLink: string = '/tenant/profile';
  @Input() supportLink: string = '/tenant/support';
  @Input() tenantData: any;
  @Output() toggleSidebar = new EventEmitter<void>();
  @Output() logout = new EventEmitter<void>();
  @Output() notificationClick = new EventEmitter<Notification>();
  
  private snackBar = inject(MatSnackBar);
  private authService = inject(AuthService);
  private notificationService = inject(NotificationService);
  private router = inject(Router);
  private iconRegistry = inject(MatIconRegistry);
  private sanitizer = inject(DomSanitizer);
  
  currentTime: string = '';
  currentDate: string = '';
  private timeInterval: any;
  private realtimeSub: any;
  private unreadSub: any;
  
  notifications: Notification[] = [];
  unreadCount: number = 0;
  showNotifications = false;
  
  userMenuOptions: UserMenuOption[] = [
    { label: 'My Profile', icon: 'user', action: 'profile' },
    { label: 'Account Settings', icon: 'settings', action: 'settings' },
    { label: 'Help & Support', icon: 'help', action: 'support' },
    { label: 'Logout', icon: 'logout', action: 'logout' }
  ];

  constructor() {
    registerHeaderIcons(this.iconRegistry, this.sanitizer);
  }
  
  ngOnInit(): void {
    this.updateDateTime();
    this.timeInterval = setInterval(() => this.updateDateTime(), 1000);
    this.loadNotifications();
    this.subscribeRealtime();
  }
  
  ngOnDestroy(): void {
    if (this.timeInterval) clearInterval(this.timeInterval);
    this.realtimeSub?.unsubscribe();
    this.unreadSub?.unsubscribe();
    this.notificationService.disconnectRealtime();
  }
  
  private updateDateTime(): void {
    const now = new Date();
    this.currentTime = now.toLocaleTimeString('en-KE', { 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit'
    });
    this.currentDate = now.toLocaleDateString('en-KE', { 
      weekday: 'long',
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  }
  
  private loadNotifications(): void {
    if (!this.authService.isAuthenticated()) {
      this.notifications = [];
      this.unreadCount = 0;
      return;
    }

    this.notificationService.connectRealtime();

    this.notificationService.list().subscribe({
      next: (items) => {
        this.notifications = items.map((item) => this.toHeaderNotification(item));
        this.updateUnreadCount();
      },
      error: () => {
        this.notifications = [];
        this.unreadCount = 0;
      }
    });
  }

  private subscribeRealtime(): void {
    this.realtimeSub = this.notificationService.realtime$.subscribe((item) => {
      const notification = this.toHeaderNotification(item);
      this.notifications = [
        notification,
        ...this.notifications.filter((existing) => existing.id !== notification.id)
      ];
      this.updateUnreadCount();
      this.snackBar.open(notification.title, 'View', { duration: 4000 })
        .onAction()
        .subscribe(() => this.markAsRead(notification));
    });

    this.unreadSub = this.notificationService.unreadCount$.subscribe((count) => {
      this.unreadCount = count;
    });
  }

  private toHeaderNotification(item: AppNotification): Notification {
    return {
      id: String(item.id),
      title: item.title,
      message: item.message,
      type: item.type,
      read: item.read,
      createdAt: new Date(item.createdAt),
      link: item.link
    };
  }
  
  get notificationsLink(): string {
    if (!this.authService.isAuthenticated()) {
      return '/auth/login';
    }
    const role = this.authService.getDashboardRole(this.authService.getCurrentUser()?.role);
    return `/${role}/notifications`;
  }

  closeNotifications(): void {
    this.showNotifications = false;
  }
  
  updateUnreadCount(): void {
    this.unreadCount = this.notifications.filter(n => !n.read).length;
  }
  
  markAsRead(notification: Notification): void {
    const id = Number(notification.id);
    if (!Number.isFinite(id)) {
      return;
    }

    this.notificationService.markRead(id).subscribe({
      next: (updated) => {
        notification.read = updated.read;
        this.updateUnreadCount();
        if (notification.link) {
          this.router.navigateByUrl(notification.link);
          this.notificationClick.emit(notification);
        }
      }
    });
  }
  
  markAllAsRead(): void {
    this.notificationService.markAllRead().subscribe({
      next: () => {
        this.notifications.forEach(n => n.read = true);
        this.updateUnreadCount();
        this.snackBar.open('All notifications marked as read', 'Close', { duration: 2000 });
      }
    });
  }
  
  clearAllNotifications(): void {
    this.notificationService.clearAll().subscribe({
      next: () => {
        this.notifications = [];
        this.unreadCount = 0;
        this.snackBar.open('All notifications cleared', 'Close', { duration: 2000 });
      }
    });
  }
  
  handleMenuAction(action: string): void {
    switch (action) {
      case 'profile':
        this.router.navigateByUrl(this.profileLink);
        break;
      case 'settings':
        this.router.navigateByUrl(this.profileLink);
        break;
      case 'security':
        this.router.navigateByUrl(this.profileLink);
        break;
      case 'billing':
        this.router.navigateByUrl(this.profileLink);
        break;
      case 'support':
        this.router.navigateByUrl(this.supportLink);
        break;
      case 'logout':
        if (this.logout.observed) {
          this.logout.emit();
        } else {
          this.authService.logout();
        }
        break;
    }
  }
  
  getInitials(name: string): string {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  }
  
  getNotificationIcon(type: string): string {
    switch(type) {
      case 'success': return 'check-circle';
      case 'error': return 'alert-circle';
      case 'warning': return 'alert-triangle';
      default: return 'info';
    }
  }
  
  getTimeAgo(date: Date): string {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return new Date(date).toLocaleDateString();
  }
}
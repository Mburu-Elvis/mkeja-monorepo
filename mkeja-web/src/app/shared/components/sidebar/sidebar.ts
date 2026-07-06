// sidebar.component.ts
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './sidebar.html',
  styleUrls: ['./sidebar.css'],
  host: {
    '[class.sidebar-collapsed]': 'collapsed'
  }
})
export class SidebarComponent {
  @Input() collapsed = false;
  @Output() collapsedChange = new EventEmitter<boolean>();

  // User info – can be overridden via inputs or service
  @Input() userName = 'John Otieno';
  @Input() userTitle = 'Principal Landlord';
  @Input() userInitials = 'JO';

  constructor() {
    // Load saved collapsed state from localStorage
    const saved = localStorage.getItem('sidebarCollapsed');
    if (saved !== null) {
      this.collapsed = saved === 'true';
    }
  }

  toggleSidebar(): void {
    this.collapsed = !this.collapsed;
    localStorage.setItem('sidebarCollapsed', String(this.collapsed));
    this.collapsedChange.emit(this.collapsed);
  }
}
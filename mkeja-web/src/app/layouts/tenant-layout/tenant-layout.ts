import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-tenant-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet],
  template: `
    <div class="tenant-layout">
      <router-outlet></router-outlet>
    </div>
  `,
  styles: [`
    .tenant-layout {
      min-height: 100vh;
      background-color: #F5F5F5;
    }
  `]
})
export class TenantLayoutComponent {}

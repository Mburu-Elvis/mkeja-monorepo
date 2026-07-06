import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';

@Component({
  selector: 'app-bottom-nav',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './bottom-nav.html',
  styleUrls: ['./bottom-nav.css']
})
export class BottomNavComponent {
  @Input() role: 'tenant' | 'landlord' = 'tenant';
  
  constructor(private router: Router) {}

  isActive(route: string): boolean {
    return this.router.url.includes(route);
  }
}
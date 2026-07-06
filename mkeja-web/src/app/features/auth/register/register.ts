import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ToastComponent } from '../../../shared/components/toast/toast';

type RegistrationPath = 'landlord' | 'agent' | 'tenant';

interface RegistrationOption {
  id: RegistrationPath;
  icon: string;
  title: string;
  subtitle: string;
  points: string[];
}

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, ToastComponent],
  templateUrl: './register.html',
  styleUrls: ['./register.css']
})
export class RegisterComponent {
  invitationCode = '';
  showToast = false;
  toastMessage = '';
  toastType: 'success' | 'error' | 'warning' | 'info' = 'error';

  readonly options: RegistrationOption[] = [
    {
      id: 'landlord',
      icon: 'building',
      title: 'Property Owner / Landlord',
      subtitle: 'Own and manage your rental portfolio',
      points: ['Add properties & units', 'Invite tenants', 'Track remittances']
    },
    {
      id: 'agent',
      icon: 'briefcase',
      title: 'Property Management Agent',
      subtitle: 'Manage properties on behalf of owners',
      points: ['Assigned properties', 'Tenant acquisition', 'Owner reporting']
    },
    {
      id: 'tenant',
      icon: 'home',
      title: 'Tenant',
      subtitle: 'Join via landlord invitation',
      points: ['Digital lease', 'M-PESA rent', 'House Hunt access']
    }
  ];

  constructor(private router: Router) {}

  startRegistration(path: RegistrationPath): void {
    if (path === 'tenant') {
      document.getElementById('invitationCode')?.focus();
      return;
    }
    this.router.navigate(['/auth/onboarding'], {
      queryParams: { role: path }
    });
  }

  goToTenantInvitation(): void {
    const code = this.invitationCode.trim();
    if (!code) {
      this.showError('Enter the invitation code from your SMS or email');
      return;
    }
    this.router.navigate(['/tenant/onboarding/invitation', code]);
  }

  showError(message: string): void {
    this.toastType = 'error';
    this.toastMessage = message;
    this.showToast = true;
  }

  closeToast(): void {
    this.showToast = false;
  }
}

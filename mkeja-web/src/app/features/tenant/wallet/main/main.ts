import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { BalanceCardComponent } from '../../../../shared/components/balance-card/balance-card';
import { LoadingSpinnerComponent } from '../../../../shared/components/loading-spinner/loading-spinner';
import { WalletService } from '../../../../core/services/wallet';
import { AuthService } from '../../../../core/services/auth';

@Component({
  selector: 'app-tenant-wallet-main',
  standalone: true,
  imports: [
    CommonModule, 
    RouterModule,
    BalanceCardComponent,
    LoadingSpinnerComponent
  ],
  templateUrl: './main.html',
  styleUrls: ['./main.css']
})
export class TenantWalletMainComponent implements OnInit {
onBack() {
throw new Error('Method not implemented.');
}
  loading = true;
  wallet: any = null;
  tenantId = '';

  constructor(
    private walletService: WalletService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    const user = this.authService.getCurrentUser();
    this.tenantId = user?.id || '';
    this.loadWallet();
  }

  loadWallet() {
    this.loading = true;
    // Simulate API call - replace with actual service call
    setTimeout(() => {
      this.wallet = {
        availableBalance: 3400,
        securityHold: 5000,
        loanBalance: 0,
        creditLimit: 3750,
        pendingSweep: 0
      };
      this.loading = false;
    }, 1000);
  }

  onTopUp() {
    // Navigate to top up page
  }
}
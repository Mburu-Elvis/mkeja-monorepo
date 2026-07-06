import { Routes } from '@angular/router';
import { AuthGuard } from './core/guards/auth-guard';
import { AdminGuard } from './core/guards/admin-guard';
import { LandlordKycGuard } from './core/guards/landlord-kyc-guard';

export const routes: Routes = [
  {
    path: 'houses',
    loadComponent: () => import('./features/landing/landing-page').then(m => m.LandingPageComponent),
    children: [
      { path: ':propertyId', loadComponent: () => import('./features/landing/public-property-detail/public-property-detail').then(m => m.PublicPropertyDetailComponent) }
    ]
  },
  { path: '', loadComponent: () => import('./features/landing/landing-page').then(m => m.LandingPageComponent) },
  { path: 'about', loadComponent: () => import('./features/landing/landing-page').then(m => m.LandingPageComponent) },
  { path: 'platform', loadComponent: () => import('./features/landing/landing-page').then(m => m.LandingPageComponent) },
  { path: 'home', redirectTo: '', pathMatch: 'full' },
  { path: 'modules', redirectTo: 'platform', pathMatch: 'full' },
  { path: 'portals', redirectTo: 'platform', pathMatch: 'full' },
  { path: 'stories', redirectTo: 'platform', pathMatch: 'full' },

  // Auth routes
  {
    path: 'auth',
    loadComponent: () => import('./layouts/auth-layout/auth-layout').then(m => m.AuthLayoutComponent),
    children: [
      { path: 'login', loadComponent: () => import('./features/auth/login/login').then(m => m.LoginComponent) },
      { path: 'register', loadComponent: () => import('./features/auth/register/register').then(m => m.RegisterComponent) },
      { path: 'forgot-password', loadComponent: () => import('./features/auth/forgot-password/forgot-password').then(m => m.ForgotPasswordComponent) },
      { path: 'verify-otp', loadComponent: () => import('./features/auth/verify-otp/verify-otp').then(m => m.VerifyOtpComponent) },
      { path: 'onboarding', loadComponent: () => import('./features/auth/onboarding/onboarding').then(m => m.OnboardingComponent) },
      { path: '', redirectTo: 'login', pathMatch: 'full' }
    ]
  },

  // Public tenant onboarding (pre-auth)
  {
    path: 'tenant/onboarding',
    children: [
      { path: 'invitation/:code', loadComponent: () => import('./features/tenant/onboarding/invitation/invitation').then(m => m.TenantOnboardingInvitationComponent) },
      { path: 'verify-identity', loadComponent: () => import('./features/tenant/onboarding/verify-identity/verify-identity').then(m => m.TenantOnboardingVerifyIdentityComponent) },
      {
        path: 'upload-documents',
        loadComponent: () => import('./layouts/tenant-sidebar-layout/tenant-sidebar-layout').then(m => m.TenantSidebarLayoutComponent),
        children: [
          { path: '', loadComponent: () => import('./features/tenant/onboarding/upload-documents/upload-documents').then(m => m.TenantOnboardingUploadDocumentsComponent) }
        ]
      },
      { path: 'kyc-docs', loadComponent: () => import('./features/tenant/onboarding/kyc-docs/kyc-docs').then(m => m.KycDocs) },
      { path: 'kyc-pending', loadComponent: () => import('./features/tenant/onboarding/kyc-pending/kyc-pending').then(m => m.TenantOnboardingKycPendingComponent) },
      { path: 'lease-sign', loadComponent: () => import('./features/tenant/onboarding/lease-sign/lease-sign').then(m => m.TenantOnboardingLeaseSignComponent) },
      { path: 'security-deposit', loadComponent: () => import('./features/tenant/onboarding/security-deposit/security-deposit').then(m => m.TenantOnboardingSecurityDepositComponent) },
      { path: 'payment-plan', loadComponent: () => import('./features/tenant/onboarding/payment-plan/payment-plan').then(m => m.TenantOnboardingPaymentPlanComponent) },
      { path: 'ratiba-consent', loadComponent: () => import('./features/tenant/onboarding/ratiba-consent/ratiba-consent').then(m => m.TenantOnboardingRatibaConsentComponent) }
    ]
  },

  // Tenant routes
  {
    path: 'tenant',
    canActivate: [AuthGuard],
    data: { role: 'TENANT' },
    loadComponent: () => import('./layouts/tenant-layout/tenant-layout').then(m => m.TenantLayoutComponent),
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', loadComponent: () => import('./features/tenant/dashboard/main/main').then(m => m.TenantDashboardMainComponent) },
      {
        path: '',
        loadComponent: () => import('./layouts/tenant-sidebar-layout/tenant-sidebar-layout').then(m => m.TenantSidebarLayoutComponent),
        children: [
          { path: 'wallet', loadComponent: () => import('./features/tenant/wallet/main/main').then(m => m.TenantWalletMainComponent) },
          { path: 'wallet/ledger', loadComponent: () => import('./features/tenant/wallet/ledger/ledger').then(m => m.TenantWalletLedgerComponent) },
          { path: 'payments', loadComponent: () => import('./features/tenant/payments/history/history').then(m => m.TenantPaymentsHistoryComponent) },
          { path: 'payments/topup', loadComponent: () => import('./features/tenant/payments/topup/topup').then(m => m.TenantPaymentsTopupComponent) },
          { path: 'loan', loadComponent: () => import('./features/tenant/loan/main/main').then(m => m.TenantLoanMainComponent) },
          { path: 'loan/request', loadComponent: () => import('./features/tenant/loan/request/request').then(m => m.TenantLoanRequestComponent) },
          { path: 'profile', loadComponent: () => import('./features/tenant/profile/main/main').then(m => m.TenantProfileMainComponent) },
          { path: 'tenancies', loadComponent: () => import('./features/tenant/tenancies/tenancies').then(m => m.TenantTenanciesComponent) },
          { path: 'house-hunt', loadComponent: () => import('./features/tenant/house-hunt/main/main').then(m => m.HouseHuntMainComponent) },
          { path: 'house-hunt/recommended', loadComponent: () => import('./features/tenant/house-hunt/recommended/recommended').then(m => m.HouseHuntRecommendedComponent) },
          { path: 'house-hunt/saved', loadComponent: () => import('./features/tenant/house-hunt/saved/saved').then(m => m.HouseHuntSavedComponent) },
          { path: 'house-hunt/property/:propertyId', loadComponent: () => import('./features/tenant/house-hunt/property-detail/property-detail').then(m => m.HouseHuntPropertyDetailComponent) },
          { path: 'house-hunt/:id', loadComponent: () => import('./features/tenant/house-hunt/detail/detail').then(m => m.HouseHuntDetailComponent) },
          { path: 'support', loadComponent: () => import('./features/tenant/support/support').then(m => m.SupportComponent), data: { supportPortal: 'tenant' } },
          { path: 'notifications', loadComponent: () => import('./features/notifications/inbox/inbox').then(m => m.NotificationsInboxComponent) }
        ]
      }
    ]
  },

  // Agent routes
  {
    path: 'agent',
    canActivate: [AuthGuard],
    data: { role: 'AGENT' },
    loadComponent: () => import('./layouts/agent-layout/agent-layout').then(m => m.AgentLayoutComponent),
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', loadComponent: () => import('./features/agent/dashboard/dashboard').then(m => m.AgentDashboardComponent) },
      { path: 'properties', loadComponent: () => import('./features/landlord/properties/list/list').then(m => m.LandlordPropertiesListComponent) },
      { path: 'properties/add', canActivate: [LandlordKycGuard], loadComponent: () => import('./features/landlord/properties/add-property/add-property').then(m => m.AddPropertyComponent) },
      { path: 'properties/add-unit', canActivate: [LandlordKycGuard], loadComponent: () => import('./features/landlord/properties/add-unit/add-unit').then(m => m.LandlordPropertiesAddUnitComponent) },
      { path: 'properties/:propertyId/house-hunt', loadComponent: () => import('./features/landlord/properties/house-hunt-settings/house-hunt-settings').then(m => m.HouseHuntPropertySettingsComponent) },
      { path: 'properties/:propertyId/units/:unitId/listing', loadComponent: () => import('./features/landlord/properties/house-hunt-settings/house-hunt-settings').then(m => m.HouseHuntPropertySettingsComponent) },
      { path: 'properties/:id', loadComponent: () => import('./features/landlord/properties/property-details/property-details').then(m => m.PropertyDetailsComponent) },
      { path: 'tenants', loadComponent: () => import('./features/landlord/tenants/list/list').then(m => m.LandlordTenantsListComponent) },
      { path: 'tenants/invite', canActivate: [LandlordKycGuard], loadComponent: () => import('./features/landlord/tenants/invite/invite').then(m => m.LandlordTenantsInviteComponent) },
      { path: 'tenants/:id', loadComponent: () => import('./features/landlord/tenants/details/details').then(m => m.LandlordTenantsDetailsComponent) },
      { path: 'units/:id', loadComponent: () => import('./features/landlord/units/details/details').then(m => m.LandlordUnitDetailsComponent) },
      { path: 'remittances', loadComponent: () => import('./features/landlord/remittances/history/history').then(m => m.LandlordRemittancesHistoryComponent) },
      { path: 'remittances/statement', loadComponent: () => import('./features/landlord/remittances/statement/statement').then(m => m.LandlordRemittancesStatementComponent) },
      { path: 'leads', loadComponent: () => import('./features/landlord/leads/leads').then(m => m.LandlordLeadsComponent) },
      { path: 'profile', loadComponent: () => import('./features/landlord/profile/profile').then(m => m.LandlordProfileComponent) },
      { path: 'support', loadComponent: () => import('./features/tenant/support/support').then(m => m.SupportComponent), data: { supportPortal: 'agent' } },
      { path: 'notifications', loadComponent: () => import('./features/notifications/inbox/inbox').then(m => m.NotificationsInboxComponent) }
    ]
  },

  // Landlord routes
  {
    path: 'landlord',
    canActivate: [AuthGuard],
    data: { role: 'LANDLORD' },
    loadComponent: () => import('./layouts/landlord-layout/landlord-layout').then(m => m.LandlordLayoutComponent),
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', loadComponent: () => import('./features/landlord/dashboard/main/main').then(m => m.LandlordDashboardMainComponent) },
      { path: 'properties', loadComponent: () => import('./features/landlord/properties/list/list').then(m => m.LandlordPropertiesListComponent) },
      { path: 'properties/add', canActivate: [LandlordKycGuard], loadComponent: () => import('./features/landlord/properties/add-property/add-property').then(m => m.AddPropertyComponent) },
      { path: 'properties/add-unit', canActivate: [LandlordKycGuard], loadComponent: () => import('./features/landlord/properties/add-unit/add-unit').then(m => m.LandlordPropertiesAddUnitComponent) },
      { path: 'properties/:propertyId/house-hunt', loadComponent: () => import('./features/landlord/properties/house-hunt-settings/house-hunt-settings').then(m => m.HouseHuntPropertySettingsComponent) },
      { path: 'properties/:propertyId/units/:unitId/listing', loadComponent: () => import('./features/landlord/properties/house-hunt-settings/house-hunt-settings').then(m => m.HouseHuntPropertySettingsComponent) },
      { path: 'properties/:id', loadComponent: () => import('./features/landlord/properties/property-details/property-details').then(m => m.PropertyDetailsComponent) },
      { path: 'tenants', loadComponent: () => import('./features/landlord/tenants/list/list').then(m => m.LandlordTenantsListComponent) },
      { path: 'tenants/invite', canActivate: [LandlordKycGuard], loadComponent: () => import('./features/landlord/tenants/invite/invite').then(m => m.LandlordTenantsInviteComponent) },
      { path: 'tenants/:id', loadComponent: () => import('./features/landlord/tenants/details/details').then(m => m.LandlordTenantsDetailsComponent) },
      { path: 'units/:id', loadComponent: () => import('./features/landlord/units/details/details').then(m => m.LandlordUnitDetailsComponent) },
      { path: 'remittances', loadComponent: () => import('./features/landlord/remittances/history/history').then(m => m.LandlordRemittancesHistoryComponent) },
      { path: 'remittances/statement', loadComponent: () => import('./features/landlord/remittances/statement/statement').then(m => m.LandlordRemittancesStatementComponent) },
      { path: 'leads', loadComponent: () => import('./features/landlord/leads/leads').then(m => m.LandlordLeadsComponent) },
      { path: 'profile', loadComponent: () => import('./features/landlord/profile/profile').then(m => m.LandlordProfileComponent) },
      { path: 'support', loadComponent: () => import('./features/tenant/support/support').then(m => m.SupportComponent), data: { supportPortal: 'landlord' } },
      { path: 'notifications', loadComponent: () => import('./features/notifications/inbox/inbox').then(m => m.NotificationsInboxComponent) }
    ]
  },

  // Admin routes
  {
    path: 'admin',
    canActivate: [AuthGuard, AdminGuard],
    loadComponent: () => import('./layouts/admin-layout/admin-layout').then(m => m.AdminLayoutComponent),
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', loadComponent: () => import('./features/admin/dashboard/main/main').then(m => m.AdminDashboardMainComponent) },
      { path: 'kyc-queue', loadComponent: () => import('./features/admin/kyc-queue/list/list').then(m => m.AdminKycQueueListComponent) },
      { path: 'kyc-queue/:id', loadComponent: () => import('./features/admin/kyc-queue/review/review').then(m => m.AdminKycQueueReviewComponent) },
      { path: 'users', loadComponent: () => import('./features/admin/users/list/list').then(m => m.AdminUsersListComponent) },
      { path: 'users/:id', loadComponent: () => import('./features/admin/users/details/details').then(m => m.AdminUsersDetailsComponent) },
      { path: 'properties', loadComponent: () => import('./features/admin/properties/list/list').then(m => m.AdminPropertiesListComponent) },
      { path: 'properties/:id', loadComponent: () => import('./features/admin/properties/details/details').then(m => m.AdminPropertiesDetailsComponent) },
      { path: 'tenancies', loadComponent: () => import('./features/admin/tenancies/list/list').then(m => m.AdminTenanciesListComponent) },
      { path: 'invitations', loadComponent: () => import('./features/admin/invitations/list/list').then(m => m.AdminInvitationsListComponent) },
      { path: 'reports', loadComponent: () => import('./features/admin/reports/hub/hub').then(m => m.AdminReportsHubComponent) },
      {
        path: 'ledger',
        loadComponent: () => import('./features/admin/reports/hub/hub').then(m => m.AdminReportsHubComponent),
        data: { defaultTab: 'ledger' }
      },
      {
        path: 'ledger/reconcile',
        loadComponent: () => import('./features/admin/reports/hub/hub').then(m => m.AdminReportsHubComponent),
        data: { defaultTab: 'reconcile' }
      },
      {
        path: 'reports/daily',
        loadComponent: () => import('./features/admin/reports/hub/hub').then(m => m.AdminReportsHubComponent),
        data: { defaultTab: 'daily' }
      },
      {
        path: 'reports/monthly',
        loadComponent: () => import('./features/admin/reports/hub/hub').then(m => m.AdminReportsHubComponent),
        data: { defaultTab: 'monthly' }
      },
      { path: 'notifications', loadComponent: () => import('./features/notifications/inbox/inbox').then(m => m.NotificationsInboxComponent) }
    ]
  },

  // Fallback
  { path: '**', redirectTo: '' }
];

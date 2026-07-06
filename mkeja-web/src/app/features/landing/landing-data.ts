export type LandingTabId = 'home' | 'houses' | 'about' | 'platform';

export interface LandingModule {
  tag: string;
  title: string;
  description: string;
  icon: string;
}

export interface LandingBenefit {
  title: string;
  description: string;
  icon: string;
}

export interface LandingStep {
  number: string;
  title: string;
  description: string;
}

export interface LandingTestimonial {
  quote: string;
  name: string;
  role: string;
  initials: string;
}

export interface LandingPortal {
  role: string;
  title: string;
  description: string;
  points: string[];
  cta: string;
  link: string;
}

export const LANDING_TABS: { id: LandingTabId; label: string; path: string }[] = [
  { id: 'home', label: 'Home', path: '/' },
  { id: 'houses', label: 'House Hunt', path: '/houses' },
  { id: 'about', label: 'About', path: '/about' },
  { id: 'platform', label: 'Platform', path: '/platform' }
];

export const LANDING_MODULES: LandingModule[] = [
  { tag: 'House Hunt', title: 'Verified listings', description: 'Public search by location and budget. Same listings tenants see after sign-in.', icon: 'home_work' },
  { tag: 'M-PESA Rent', title: 'Phone-native payments', description: 'Collect rent via STK Push, wallet top-ups, and automated landlord remittances.', icon: 'payments' },
  { tag: 'KYC', title: 'Compliance built in', description: 'Identity verification and admin review before every lease is issued.', icon: 'verified_user' },
  { tag: 'Ratiba', title: 'Scheduled rent', description: 'Standing orders so rent lands on time and cash flow stays predictable.', icon: 'event_repeat' }
];

export const LANDING_BENEFITS: LandingBenefit[] = [
  { title: 'One ledger', description: 'Tenants, landlords, and admins share tenancy and payment records.', icon: 'hub' },
  { title: 'Phone-first', description: 'M-PESA number login and PIN auth — built for how Kenya moves money.', icon: 'smartphone' },
  { title: 'Full lifecycle', description: 'Invite, verify, sign, deposit, rent, and remit in one tracked flow.', icon: 'sync_alt' }
];

export const LANDING_PORTALS: LandingPortal[] = [
  { role: 'Landlord', title: 'Manage properties', description: 'List units, invite tenants, and track remittances.', points: ['Properties & units', 'Tenant invites', 'Remittance statements'], cta: 'Sign in', link: '/auth/login' },
  { role: 'Agent', title: 'Manage on behalf of owners', description: 'Property operations, tenant acquisition, rent collection, and reporting.', points: ['Assigned properties', 'Leads & invitations', 'Owner statements'], cta: 'Sign in', link: '/auth/login' },
  { role: 'Tenant', title: 'Rent & discover', description: 'Browse homes, pay rent, and manage your lease.', points: ['House Hunt', 'Wallet & Ratiba', 'Digital lease'], cta: 'Sign in', link: '/auth/login' },
  { role: 'Admin', title: 'Platform ops', description: 'KYC review, property verification, and tenancy admin.', points: ['KYC queue', 'Verification', 'Reports'], cta: 'Sign in', link: '/auth/login' }
];

export const LANDING_STEPS: LandingStep[] = [
  { number: '1', title: 'Invite & verify', description: 'Landlord invites tenant. Both complete KYC.' },
  { number: '2', title: 'Sign & deposit', description: 'Digital lease and security deposit via wallet.' },
  { number: '3', title: 'Pay & remit', description: 'M-PESA or Ratiba rent with auto reconciliation.' }
];

export const LANDING_TESTIMONIALS: LandingTestimonial[] = [
  { quote: 'Ratiba handles rent and I see every shilling in my remittance statement.', name: 'Grace W.', role: 'Landlord', initials: 'GW' },
  { quote: 'Found a verified unit on House Hunt and signed my lease in the app.', name: 'Brian O.', role: 'Tenant', initials: 'BO' },
  { quote: 'KYC and tenancy tools keep compliance in one dashboard.', name: 'Faith M.', role: 'Admin', initials: 'FM' }
];

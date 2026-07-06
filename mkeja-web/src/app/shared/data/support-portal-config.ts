import { SupportPortal } from '../../core/services/support.service';

export interface SupportCategoryOption {
  value: string;
  label: string;
}

export interface SupportFaqCategory {
  id: string;
  name: string;
  icon: string;
  count: number;
}

export interface SupportFaqItem {
  id: number;
  category: string;
  question: string;
  answer: string;
}

export interface SupportPortalConfig {
  title: string;
  subtitle: string;
  phone: string;
  categories: SupportCategoryOption[];
  faqCategories: SupportFaqCategory[];
  faqs: SupportFaqItem[];
}

const TENANT_CONFIG: SupportPortalConfig = {
  title: 'Support Center',
  subtitle: 'Get help with payments, auto-deductions, Fuliza, and more',
  phone: '+254 700 123 456',
  categories: [
    { value: 'payment', label: 'Payment Issue' },
    { value: 'fuliza', label: 'Rent Fuliza' },
    { value: 'ratiba', label: 'Auto-Deductions' },
    { value: 'account', label: 'Account & KYC' },
    { value: 'technical', label: 'Technical Issue' },
    { value: 'other', label: 'Other' }
  ],
  faqCategories: [
    { id: 'payment', name: 'Payments', icon: 'banknote', count: 4 },
    { id: 'fuliza', name: 'Rent Fuliza', icon: 'zap', count: 3 },
    { id: 'ratiba', name: 'Auto-Deductions', icon: 'calendar', count: 3 },
    { id: 'account', name: 'Account & KYC', icon: 'user', count: 3 },
    { id: 'technical', name: 'Technical Issues', icon: 'settings', count: 2 }
  ],
  faqs: [
    {
      id: 1,
      category: 'payment',
      question: 'How do I make a rent payment?',
      answer: 'Pay via M-Pesa STK Push from your dashboard, Paybill 522533 (account = your phone number), or set up automatic deductions in Ratiba.'
    },
    {
      id: 2,
      category: 'payment',
      question: 'When is my rent due?',
      answer: 'Rent is due on the date set in your lease, typically the 5th of each month. Late payments may affect your credit score.'
    },
    {
      id: 3,
      category: 'payment',
      question: 'How can I get a rent receipt?',
      answer: 'Receipts are generated after each payment. View and download them from Payments or your wallet ledger.'
    },
    {
      id: 4,
      category: 'payment',
      question: 'What payment methods are accepted?',
      answer: 'M-Pesa STK Push, Paybill, and Ratiba auto-deductions. Bank transfers are coming soon.'
    },
    {
      id: 5,
      category: 'fuliza',
      question: 'What is Rent Fuliza?',
      answer: 'An overdraft facility that covers rent shortfalls on your due date and helps you avoid late penalties.'
    },
    {
      id: 6,
      category: 'fuliza',
      question: 'How is my credit limit determined?',
      answer: 'Based on payment history, tenure on Mkeja, and KYC status. On-time payments increase your limit over time.'
    },
    {
      id: 7,
      category: 'fuliza',
      question: 'What are the Fuliza fees?',
      answer: 'Fees range from 2.5% to 5% depending on your tier — Bronze 5%, Silver 4%, Gold 3%, Platinum 2.5%.'
    },
    {
      id: 8,
      category: 'ratiba',
      question: 'How do I set up auto-deductions?',
      answer: 'Open Financial Hub → Auto-Deductions, pick Daily or Weekly, accept terms, and authorize via STK Push.'
    },
    {
      id: 9,
      category: 'ratiba',
      question: 'Can I cancel auto-deductions anytime?',
      answer: 'Yes — cancel from the Auto-Deductions tab with no penalty. Cancellation takes effect immediately.'
    },
    {
      id: 10,
      category: 'ratiba',
      question: 'What happens if a deduction fails?',
      answer: 'You will get a notification. Top up M-Pesa and retry, or pay manually before your due date.'
    },
    {
      id: 11,
      category: 'account',
      question: 'How do I complete KYC verification?',
      answer: 'Go to Profile → upload your ID and a selfie. Verification usually completes within 1–2 business days.'
    },
    {
      id: 12,
      category: 'account',
      question: 'How do I update my personal information?',
      answer: 'Update phone, email, and other details from Profile. Some changes may require KYC re-verification.'
    },
    {
      id: 13,
      category: 'account',
      question: 'My KYC was rejected — what now?',
      answer: 'Re-upload clearer documents from Profile, or raise a support ticket and our team will help you resubmit.'
    },
    {
      id: 14,
      category: 'technical',
      question: 'The app is loading slowly — what should I do?',
      answer: 'Clear browser cache, check your connection, or try another browser. Raise a ticket if it persists.'
    },
    {
      id: 15,
      category: 'technical',
      question: 'I did not receive an STK Push — what now?',
      answer: 'Confirm M-Pesa balance and network, then request a new STK Push from the payment screen.'
    }
  ]
};

const LANDLORD_CONFIG: SupportPortalConfig = {
  title: 'Landlord Support',
  subtitle: 'Help with properties, tenants, remittances, and KYC verification',
  phone: '+254 700 123 456',
  categories: [
    { value: 'properties', label: 'Properties & Units' },
    { value: 'tenants', label: 'Tenants & Invitations' },
    { value: 'remittances', label: 'Remittances & Payouts' },
    { value: 'leads', label: 'House Hunt Leads' },
    { value: 'kyc', label: 'KYC & Verification' },
    { value: 'account', label: 'Account & Profile' },
    { value: 'technical', label: 'Technical Issue' },
    { value: 'other', label: 'Other' }
  ],
  faqCategories: [
    { id: 'properties', name: 'Properties', icon: 'building', count: 3 },
    { id: 'tenants', name: 'Tenants', icon: 'users', count: 3 },
    { id: 'remittances', name: 'Remittances', icon: 'creditCard', count: 2 },
    { id: 'kyc', name: 'KYC', icon: 'shield', count: 2 },
    { id: 'technical', name: 'Technical', icon: 'settings', count: 2 }
  ],
  faqs: [
    {
      id: 101,
      category: 'properties',
      question: 'How do I add a new property?',
      answer: 'Go to Properties → Add Property, fill in location and details, then add units. KYC approval is required first.'
    },
    {
      id: 102,
      category: 'properties',
      question: 'How do I list a unit on House Hunt?',
      answer: 'Open the property or unit, go to House Hunt settings, enable the listing, and set rent plus photos.'
    },
    {
      id: 103,
      category: 'properties',
      question: 'Can I edit unit rent after listing?',
      answer: 'Yes — update rent from the unit details page. Active tenancies keep their lease terms until renewed.'
    },
    {
      id: 104,
      category: 'tenants',
      question: 'How do I invite a tenant?',
      answer: 'Tenants → Invite Tenant, enter their phone and lease details. They receive an SMS link to onboard on Mkeja.'
    },
    {
      id: 105,
      category: 'tenants',
      question: 'A tenant invitation expired — what now?',
      answer: 'Cancel the old invitation if needed and send a fresh one with updated lease dates.'
    },
    {
      id: 106,
      category: 'tenants',
      question: 'How do I view a tenant payment history?',
      answer: 'Open the tenant profile from Tenants → select tenant → view tenancy and payment activity.'
    },
    {
      id: 107,
      category: 'remittances',
      question: 'When do I receive rent remittances?',
      answer: 'Remittances are processed after tenant payments clear, typically within 1–2 business days.'
    },
    {
      id: 108,
      category: 'remittances',
      question: 'How do I download a remittance statement?',
      answer: 'Remittances → Statement, pick your date range, and export the summary.'
    },
    {
      id: 109,
      category: 'kyc',
      question: 'Why is my KYC still pending?',
      answer: 'Verification takes 1–2 business days. Ensure documents are clear and match your registered details.'
    },
    {
      id: 110,
      category: 'kyc',
      question: 'My KYC was rejected — how do I fix it?',
      answer: 'Raise a support ticket with your rejection reason. Our team will guide you through resubmission.'
    },
    {
      id: 111,
      category: 'technical',
      question: 'I cannot add units to my property',
      answer: 'Confirm KYC is approved and the property is saved. Refresh the page or raise a ticket with the property name.'
    },
    {
      id: 112,
      category: 'technical',
      question: 'Dashboard numbers look wrong',
      answer: 'Data refreshes periodically. If figures stay off after 24 hours, raise a ticket with screenshots.'
    }
  ]
};

const AGENT_CONFIG: SupportPortalConfig = {
  ...LANDLORD_CONFIG,
  title: 'Agent Support',
  subtitle: 'Help managing client properties, tenants, leads, and agency verification',
  faqs: [
    ...LANDLORD_CONFIG.faqs,
    {
      id: 201,
      category: 'kyc',
      question: 'How do I complete agency KYC?',
      answer: 'Upload agency registration documents and director ID from Profile. Approval unlocks property and tenant tools.'
    },
    {
      id: 202,
      category: 'leads',
      question: 'How do House Hunt leads work for agents?',
      answer: 'Interested tenants appear in Leads. Follow up quickly — leads show property, unit, and contact preferences.'
    }
  ],
  faqCategories: [
    ...LANDLORD_CONFIG.faqCategories,
    { id: 'leads', name: 'Leads', icon: 'search', count: 1 }
  ],
  categories: [
    ...LANDLORD_CONFIG.categories
  ]
};

export function getSupportPortalConfig(portal: SupportPortal): SupportPortalConfig {
  switch (portal) {
    case 'landlord':
      return LANDLORD_CONFIG;
    case 'agent':
      return AGENT_CONFIG;
    default:
      return TENANT_CONFIG;
  }
}

export function detectSupportPortalFromUrl(url: string): SupportPortal {
  if (url.includes('/agent/')) return 'agent';
  if (url.includes('/landlord/')) return 'landlord';
  return 'tenant';
}

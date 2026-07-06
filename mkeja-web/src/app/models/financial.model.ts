import { PaymentPlanOption, RatibaStatus } from "./ratiba.model";

// shared/models/financial.models.ts
export interface TenantData {
  id: string;
  name: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  kycStatus: 'PENDING' | 'APPROVED' | 'REJECTED' | 'MANUAL_REVIEW';
  joinedDate: Date;
  profileImage: string | null;
}

export interface PropertyData {
  address: string;
  unitName: string;
  unitRef: string;
  landlordName: string;
  landlordPhone: string;
  landlordEmail: string;
  leaseStart: Date;
  leaseEnd: Date;
  status: 'ACTIVE' | 'SUSPENDED' | 'TERMINATED' | 'PENDING_KYC';
  graceDays: number;
  dueDay: number;
}

export interface FinancialData {
  monthlyRent: number;
  securityDeposit: number;
  paidToDate: number;
  currentBalance: number;
  pendingSweep: number;
  lastPaymentDate: Date;
  lastPaymentAmount: number;
  nextDueDate: Date;
  paymentPlan: 'DAILY' | 'WEEKLY' | 'MONTHLY';
  paymentHistory: PaymentRecord[];
  paymentStats: PaymentStats;
  recentTransactions: Transaction[];
}

export interface PaymentRecord {
  id: string;
  date: Date;
  amount: number;
  type: 'rent' | 'deposit' | 'loan';
  status: 'PENDING' | 'COMPLETED' | 'FAILED';
  reference: string;
}

export interface PaymentStats {
  onTimeRate: number;
  consistencyScore: number;
  averageContribution: number;
  totalPaidLifetime: number;
}

export interface Transaction {
  id: string;
  type: 'credit' | 'debit';
  amount: number;
  description: string;
  date: Date;
  reference: string;
  category: string;
  status: 'PENDING' | 'COMPLETED' | 'FAILED';
}

export interface RatibaData {
  active: RatibaOrder | null;
  availablePlans?: PaymentPlanOption[]; // Make optional if not always present
  recentDeductions: DeductionRecord[];
  failedDeductions: DeductionRecord[];
  totalDeducted: number;
  totalFailed: number;
  canSetup?: {
    allowed: boolean;
    reason?: string;
  };
}
export interface RatibaOrder {
  id: string;
  planId: string;
  planName: string;
  amount: number;
  frequency: number;
  startDate: Date;
  endDate: Date;
  nextDeduction: Date | null;
  lastDeduction: Date | null;
  status: RatibaStatus;
  totalDeducted: number;
  remainingDeductions: number;
}

export interface DeductionRecord {
  id: string;
  date: Date;
  amount: number;
  status: 'SUCCESS' | 'FAILED' | 'PENDING' | 'RETRYING';
  reference: string;
  description: string;
  errorCode?: string;
}

export interface FulizaData {
  creditScore: number;
  creditTier: 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM';
  availableLimit: number;
  totalLimit: number;
  utilizedAmount: number;
  outstandingLoan: number;
  activeLoan: Loan | null;
  loanHistory: Loan[];
  autoTopUpEnabled: boolean;
  totalInterestPaid: number;
  totalBorrowed: number;
}

export interface Loan {
  id: string;
  amount: number;
  fee: number;
  totalRepayable: number;
  repaid: number;
  status: 'ACTIVE' | 'REPAID' | 'DEFAULT';
  date: Date;
  repaidDate?: Date;
  purpose: string;
}

export interface BankData {
  linked: boolean;
  bankName: string;
  accountName: string;
  accountNumber: string;
  branchCode: string;
  swiftCode: string;
  verified: boolean;
}
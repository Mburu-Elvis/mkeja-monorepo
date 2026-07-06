// models/ratiba.model.ts

export type PaymentPlan = 'DAILY' | 'WEEKLY' | 'MONTHLY';
export type RatibaStatus = 'ACTIVE' | 'PAUSED' | 'CANCELLED' | 'EXPIRED';
export type DeductionStatus = 'SUCCESS' | 'FAILED' | 'PENDING' | 'RETRYING';

// ==================== RATIBA ORDER MODELS ====================

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

export interface RatibaStandingOrder {
  standingOrderId: string;
  standingOrderName: string;
  tenantId: string;
  walletId: string;
  plan: PaymentPlan;
  amount: number;
  monthlyRent: number;
  frequency: number;
  startDate: Date;
  endDate: Date;
  status: RatibaStatus;
  businessShortCode: string;
  accountReference: string;
  createdAt: Date;
  lastDeductionAt: Date | null;
  nextDeductionAt: Date | null;
}

// ==================== DEDUCTION MODELS ====================

export interface DeductionRecord {
  deductionId: string;
  standingOrderId: string;
  transactionId: string;
  amount: number;
  status: DeductionStatus;
  resultCode: string;
  resultDesc: string;
  msisdn: string;
  deductedAt: Date;
  createdAt: Date;
}

// ==================== API REQUEST/RESPONSE MODELS ====================

export interface RatibaSetupRequest {
  standingOrderName: string;
  startDate: string; // YYYYMMDD
  endDate: string; // YYYYMMDD
  businessShortCode: string;
  transactionType: string;
  receiverPartyIdentifierType: string;
  amount: string;
  partyA: string; // tenant MSISDN
  callbackURL: string;
  accountReference: string;
  transactionDesc: string;
  frequency: string;
}

export interface RatibaSetupResponse {
  responseHeader: {
    responseRefID: string;
    responseCode: string;
    responseDescription: string;
    resultDesc?: string;
  };
  responseBody: {
    responseDescription: string;
    responseCode: string;
  };
}

export interface RatibaCallbackPayload {
  responseHeader: {
    responseRefID: string;
    requestRefID: string;
    responseCode: string;
    responseDescription: string;
  };
  responseBody: {
    responseData: Array<{
      name: string;
      value: string;
    }>;
  };
}

// ==================== WALLET & PROGRESS MODELS ====================

export interface WalletBalance {
  walletId: string;
  tenantId: string;
  availableBalance: number;
  securityHold: number;
  loanBalance: number;
  creditLimit: number;
  pendingSweep: number;
  currency: string;
  lastUpdated: Date;
}

export interface RentProgress {
  monthlyRent: number;
  paidThisMonth: number;
  remaining: number;
  percentage: number;
  dueDate: Date;
  isOnTrack: boolean;
}

// ==================== PAYMENT PLAN MODELS ====================

export interface PaymentPlanOption {
  id: string;
  name: string;
  value: string;
  label: string;
  amount: number;
  amountPerDeduction: number;
  frequencyLabel: string;
  frequencyValue: number;
  monthlyTotal: number;
  description: string;
  features: string[];
  icon: string;
  recommended?: boolean;
}

// ==================== COMPLETE RATIBA DATA MODEL ====================

export interface RatibaData {
  active: RatibaOrder | null;
  availablePlans: PaymentPlanOption[];
  recentDeductions: DeductionRecord[];
  failedDeductions: DeductionRecord[];
  totalDeducted: number;
  totalFailed: number;
  canSetup: {
    allowed: boolean;
    reason?: string;
  };
}
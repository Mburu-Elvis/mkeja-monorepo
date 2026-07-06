export type PaymentPlan = 'DAILY' | 'WEEKLY' | 'MONTHLY';
export type KycStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'MANUAL_REVIEW';

export interface LandlordOnboardingPayload {
  userType: string;
  fullName: string;
  email: string;
  phone: string;
  idNumber?: string;
  kraPin?: string;
  companyName?: string;
  regNumber?: string;
  saccoName?: string;
  saccoLic?: string;
  licenseNumber?: string;
  physicalAddress?: string;
  city?: string;
  county?: string;
  website?: string;
  directors?: StakeholderPayload[];
  owners?: StakeholderPayload[];
  trustees?: StakeholderPayload[];
  bankName?: string;
  bankAccNum?: string;
  bankCode?: string;
  bankBranch?: string;
  terms: boolean;
  docs?: Record<string, string | null>;
  pin?: string;
}

export interface StakeholderPayload {
  name: string;
  id: string;
  kra?: string;
  pct?: string;
}

export interface LandlordOnboardingResponse {
  applicationId: string;
  kycStatus: KycStatus;
  message: string;
}

export interface InvitationDetails {
  code: string;
  landlordName: string;
  unitName: string;
  monthlyRent: number;
  depositAmount?: number;
  rentDueDay?: number;
  leaseStartDate?: string;
  leaseEndDate?: string;
  address: string;
  invitationUrl?: string;
  qrCodeUrl?: string;
  message?: string;
  existingTenant?: boolean;
  tenantKycStatus?: string;
  tenancyCreated?: boolean;
  tenancyId?: number;
  flowType?: string;
}

export interface TenantInvitationSummary {
  code: string;
  status: string;
  landlordName: string;
  propertyName: string;
  unitNumber: string;
  unitId: number;
  propertyId: number;
  monthlyRent: number;
  leaseStartDate?: string;
  expiresAt?: string;
  invitationUrl: string;
}

export interface LeaseSummary {
  landlordName: string;
  unitName: string;
  propertyAddress: string;
  monthlyRent: number;
  depositAmount?: number;
  leaseStartDate?: string;
  leaseEndDate?: string;
}

export interface TenancyCreationResult {
  tenancyId: string;
  leaseId: string;
  invitationCode: string;
  message: string;
}

export interface CreateInvitationPayload {
  fullName: string;
  phone: string;
  email?: string;
  unitId: number;
  monthlyRent: number;
  depositAmount?: number;
  rentDueDay?: number;
  leaseStartDate: string;
  leaseEndDate?: string;
}

export interface TenantRegisterPayload {
  invitationCode: string;
  fullName: string;
  phone: string;
  idNumber: string;
  idType: string;
}

export interface TenantRegisterResponse {
  tenantId: string;
  walletId: string;
  kycStatus: KycStatus;
  securityDepositStkRef: string;
  message: string;
}

export interface SecurityDepositResponse {
  stkRef: string;
  status: string;
}

export interface RatibaOnboardingResponse {
  scheduleId: string;
  status: string;
}

export interface TenantProfile {
  tenantId: string;
  fullName: string;
  phone: string;
  unitName: string;
  monthlyRent: number;
  kycStatus?: KycStatus;
}

export interface KycDocumentUploadResponse {
  kycStatus: KycStatus;
  message: string;
  documentsUploaded: string[];
}

export interface TenantOnboardingContext {
  tenantId: string;
  kycStatus: KycStatus;
  invitationCode?: string;
  documentsComplete: boolean;
}

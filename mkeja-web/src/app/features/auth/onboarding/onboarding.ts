import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { OnboardingService } from '../../../core/services/onboarding.service';

import { StepperComponent } from '../stepper/stepper';
import { FieldComponent } from '../field/field';
import { InputComponent } from '../input/input';
import { SelectComponent } from '../select/select';
import { BtnComponent } from '../btn/btn';
import { ToastComponent } from '../toast/toast';
import { SectionHeadComponent } from '../section-head/section-head';
import { UploadCardComponent } from '../upload-card/upload-card';

interface ToastMsg { text: string; type: 'success' | 'error' | 'info'; }
interface Director { name: string; id: string; kra: string; }
interface Owner { name: string; id: string; pct: string; }
interface Trustee { name: string; id: string; kra: string; }

@Component({
  selector: 'app-onboarding',
  standalone: true,
  imports: [
    CommonModule, FormsModule, RouterModule,
    StepperComponent, FieldComponent, InputComponent, SelectComponent,
    BtnComponent, ToastComponent, SectionHeadComponent, UploadCardComponent,
  ],
  templateUrl: './onboarding.html',
  styleUrls: ['./onboarding.css']
})
export class OnboardingComponent {

  constructor(
    private onboardingService: OnboardingService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    const role = this.route.snapshot.queryParamMap.get('role');
    if (role === 'agent') {
      this.registrationKind = 'agent';
      this.userType = 'INDIVIDUAL_AGENT';
    }
  }

  // ── UI state ──────────────────────────────────────────────────────────────
  registrationKind: 'landlord' | 'agent' = 'landlord';
  step = 1;
  userType = 'INDIVIDUAL_LANDLORD';
  toast: ToastMsg | null = null;
  loading = false;
  showSuccess = false;
  touchedAll = false;

  // ── Step 1 ────────────────────────────────────────────────────────────────
  fullName = '';
  email = '';
  phone = '';
  idNumber = '';
  kraPin = '';
  pin = '';
  confirmPin = '';
  companyName = '';
  regNumber = '';
  saccoName = '';
  saccoLic = '';
  licenseNumber = '';
  physicalAddress = '';
  city = '';
  county = '';
  website = '';
  directors: Director[] = [];
  owners: Owner[] = [];
  trustees: Trustee[] = [];

  // ── Step 2 ────────────────────────────────────────────────────────────────
  bankName = '';
  bankAccNum = '';
  bankCode = '';
  bankBranch = '';
  terms = false;

  // ── Step 3 ────────────────────────────────────────────────────────────────
  docs: { [key: string]: string | null } = {};

  // ── Static data ───────────────────────────────────────────────────────────
  userTypes = [
    { val: 'INDIVIDUAL_LANDLORD', icon: 'person', title: 'Individual Owner', desc: 'Personal property owner' },
    { val: 'CORPORATE_LANDLORD', icon: 'business', title: 'Company Owner', desc: 'Registered company or institution' },
    { val: 'SACCO', icon: 'account_balance', title: 'SACCO', desc: 'Savings cooperative' },
  ];

  agentUserTypes = [
    { val: 'INDIVIDUAL_AGENT', icon: 'badge', title: 'Individual Agent', desc: 'Licensed property manager' },
    { val: 'COMPANY_AGENT', icon: 'apartment', title: 'Agency / PMC', desc: 'Registered management company' },
  ];

  bankOptions = [
    { value: '01', label: 'KCB Bank' },
    { value: '02', label: 'Equity Bank' },
    { value: '03', label: 'Co-operative Bank' },
    { value: '04', label: 'Absa Bank Kenya' },
    { value: '11', label: 'NCBA Bank' },
    { value: '23', label: 'Stanbic Bank' },
    { value: '31', label: 'I&M Bank' },
    { value: '57', label: 'Diamond Trust Bank' },
    { value: '63', label: 'Family Bank' },
    { value: '68', label: 'Prime Bank' },
    { value: '76', label: 'National Bank of Kenya' },
  ];

  footerItems = ['256-bit Encryption', 'CBK Compliant', 'M-Pesa Integrated', 'KCB Partnered'];

  nextSteps = [
    ['Automated verification', 'IPRS and KRA checks complete within minutes'],
    ['Document review', 'Our compliance team verifies uploaded documents'],
    ['Add your properties', 'Once approved, register rental properties from your dashboard'],
  ];

  agentNextSteps = [
    ['License verification', 'We validate your estate agency credentials'],
    ['Owner assignment', 'Property owners link you to managed buildings'],
    ['Start managing', 'Access leads, tenants, and owner statements from your agent hub'],
  ];

  get isAgentRegistration(): boolean {
    return this.registrationKind === 'agent';
  }

  get activeUserTypes() {
    return this.isAgentRegistration ? this.agentUserTypes : this.userTypes;
  }

  get registrationTitle(): string {
    return this.isAgentRegistration ? 'Register as Property Agent' : 'Register as Property Owner';
  }

  get registrationSubtitle(): string {
    return this.isAgentRegistration
      ? 'Identity, agency license, and KYC documents · Properties are assigned by owners after approval'
      : 'Identity, bank account, and KYC documents · Properties come after approval';
  }

  // ── Computed getters ──────────────────────────────────────────────────────
  get totalSteps(): number {
    return this.userType === 'TENANT' ? 3 : 4;
  }

  get stepLabels(): string[] {
    return this.userType === 'TENANT'
      ? ['Account', 'Documents', 'Review']
      : ['Account Type', 'Registration', 'KYC Documents', 'Review'];
  }

  /** Errors for the CURRENT step only */
  get errors(): { [key: string]: string } {
    const e: { [key: string]: string } = {};

    // STEP 1: account type only
    if (this.step === 1 && this.userType !== 'TENANT') {
      // no required fields — type always selected
    }

    // STEP 2: registration details (landlord)
    if (this.step === 2 && this.userType !== 'TENANT') {
      if (!this.fullName?.trim() || this.fullName.length < 3) {
        e['fullName'] = 'Full name required (min 3 chars)';
      }
      if (!this.email?.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
        e['email'] = 'Valid email required';
      }
      if (!this.phone?.match(/^(07|01|254)[0-9]{8,9}$/)) {
        e['phone'] = 'Valid Kenyan phone required';
      }
      if (!this.pin || this.pin.length < 4) {
        e['pin'] = 'PIN must be at least 4 digits';
      }
      if (this.pin !== this.confirmPin) {
        e['confirmPin'] = 'PINs do not match';
      }
      if (!this.idNumber?.match(/^[0-9]{6,8}$/)) {
        e['idNumber'] = '6–8 digit ID number';
      }
      if (!this.kraPin?.match(/^[A-Z][0-9]{9}[A-Z]$/)) {
        e['kraPin'] = 'Format: A001234567Z';
      }
      if (this.isAgentRegistration) {
        if (!this.licenseNumber?.trim()) {
          e['licenseNumber'] = 'Agency license number is required';
        }
        if (!this.physicalAddress?.trim()) {
          e['physicalAddress'] = 'Business address is required';
        }
        if (!this.city?.trim()) {
          e['city'] = 'City is required';
        }
        if (!this.county?.trim()) {
          e['county'] = 'County is required';
        }
        if (this.userType === 'COMPANY_AGENT') {
          if (!this.companyName?.trim()) e['companyName'] = 'Company name required';
          if (!this.regNumber?.trim()) e['regNumber'] = 'Registration number required';
        }
      } else {
        if (!this.bankName?.trim()) {
          e['bankName'] = 'Account name required';
        }
        if (!this.bankAccNum?.match(/^[0-9]{10,16}$/)) {
          e['bankAccNum'] = '10–16 digit account number';
        }
        if (!this.bankCode) {
          e['bankCode'] = 'Select a bank';
        }
        if (!this.bankBranch?.trim()) {
          e['bankBranch'] = 'Branch required';
        }
      }
      if (!this.terms) {
        e['terms'] = 'You must accept terms';
      }
      if (!this.isAgentRegistration && this.userType === 'CORPORATE_LANDLORD') {
        if (!this.companyName?.trim()) e['companyName'] = 'Company name required';
        if (!this.regNumber?.trim()) e['regNumber'] = 'Registration number required';
      }
      if (this.userType === 'SACCO') {
        if (!this.saccoName?.trim()) e['saccoName'] = 'SACCO name required';
        if (!this.saccoLic?.trim()) e['saccoLic'] = 'License number required';
      }
    }

    // STEP 1 tenant (legacy path)
    if (this.step === 1 && this.userType === 'TENANT') {
      if (!this.fullName?.trim() || this.fullName.length < 3) {
        e['fullName'] = 'Full name required (min 3 chars)';
      }
      if (!this.email?.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
        e['email'] = 'Valid email required';
      }
      if (!this.phone?.match(/^(07|01|254)[0-9]{8,9}$/)) {
        e['phone'] = 'Valid Kenyan phone required';
      }
    }

    const docStep = this.userType === 'TENANT' ? 2 : 3;
    if (this.step === docStep) {
      switch (this.userType) {
        case 'INDIVIDUAL_LANDLORD':
          if (!this.docs['idFront']) e['idFront'] = 'Required';
          if (!this.docs['idBack']) e['idBack'] = 'Required';
          if (!this.docs['selfie']) e['selfie'] = 'Required';
          if (!this.docs['proofOfBankOwnership']) e['proofOfBankOwnership'] = 'Required';
          break;
        case 'CORPORATE_LANDLORD':
          if (!this.docs['incorporation']) e['incorporation'] = 'Required';
          if (!this.docs['cr12']) e['cr12'] = 'Required';
          if (!this.docs['bizAddress']) e['bizAddress'] = 'Required';
          if (!this.docs['boardRes']) e['boardRes'] = 'Required';
          break;
        case 'SACCO':
          if (!this.docs['saccoLic']) e['saccoLic'] = 'Required';
          if (!this.docs['saccoBylaws']) e['saccoBylaws'] = 'Required';
          if (!this.docs['bizAddress']) e['bizAddress'] = 'Required';
          break;
        case 'INDIVIDUAL_AGENT':
          if (!this.docs['idFront']) e['idFront'] = 'Required';
          if (!this.docs['idBack']) e['idBack'] = 'Required';
          if (!this.docs['selfie']) e['selfie'] = 'Required';
          if (!this.docs['agentLicense']) e['agentLicense'] = 'Required';
          break;
        case 'COMPANY_AGENT':
          if (!this.docs['incorporation']) e['incorporation'] = 'Required';
          if (!this.docs['cr12']) e['cr12'] = 'Required';
          if (!this.docs['agentLicense']) e['agentLicense'] = 'Required';
          if (!this.docs['bizAddress']) e['bizAddress'] = 'Required';
          break;
        case 'TENANT':
          if (!this.docs['idFront']) e['idFront'] = 'Required';
          if (!this.docs['selfie']) e['selfie'] = 'Required';
          break;
      }
    }

    return e;
  }

  getError(field: string): string | null {
    return this.touchedAll ? (this.errors[field] ?? null) : null;
  }

  isUploaded(value: any): boolean {
    return String(value).includes('✓');
  }

  get reviewSections(): Array<{ title: string; rows: [string, string][] }> {
    const bankNames: { [k: string]: string } = {
      '01': 'KCB Bank', '02': 'Equity Bank', '03': 'Co-operative Bank',
      '04': 'Absa Bank Kenya', '11': 'NCBA Bank', '23': 'Stanbic Bank',
      '31': 'I&M Bank', '57': 'Diamond Trust Bank', '63': 'Family Bank',
      '68': 'Prime Bank', '76': 'National Bank of Kenya',
    };
    const typeNames: { [k: string]: string } = {
      INDIVIDUAL_LANDLORD: 'Individual Landlord',
      CORPORATE_LANDLORD: 'Corporate Landlord',
      SACCO: 'SACCO',
      INDIVIDUAL_AGENT: 'Individual Agent',
      COMPANY_AGENT: 'Agency / PMC',
      TENANT: 'Tenant',
    };
    const docLabels: { [k: string]: string } = {
      idFront: 'ID Front', idBack: 'ID Back', selfie: 'Selfie',
      proofOfResidence: 'Proof of Residence',
      proofOfBankOwnership: 'Proof of Bank Ownership',
      incorporation: 'Certificate of Incorporation',
      cr12: 'CR12 Form', bizAddress: 'Business Address',
      boardRes: 'Board Resolution', saccoLic: 'SASRA License',
      saccoBylaws: 'SACCO By-Laws', agentLicense: 'Agency License',
    };

    const sections: Array<{ title: string; rows: [string, string][] }> = [];

    const personalRows: [string, string][] = [
      ['Full Name', this.fullName || '—'],
      ['Email', this.email || '—'],
      ['Phone', this.phone || '—'],
    ];
    if (this.userType !== 'TENANT') {
      personalRows.push(['ID Number', this.idNumber || '—']);
      personalRows.push(['KRA PIN', this.kraPin || '—']);
      if (this.isAgentRegistration) {
        personalRows.push(['License Number', this.licenseNumber || '—']);
        personalRows.push(['Address', this.physicalAddress || '—']);
        personalRows.push(['City / County', `${this.city || '—'} / ${this.county || '—'}`]);
        if (this.userType === 'COMPANY_AGENT') {
          personalRows.push(['Company', this.companyName || '—']);
          personalRows.push(['Registration No.', this.regNumber || '—']);
        }
      }
    }
    personalRows.push(['Account Type', typeNames[this.userType] || this.userType]);
    sections.push({ title: 'Personal Information', rows: personalRows });

    if (this.userType !== 'TENANT' && !this.isAgentRegistration) {
      sections.push({
        title: 'Settlement Account',
        rows: [
          ['Bank Account Name', this.bankName || '—'],
          ['Account Number', this.bankAccNum || '—'],
          ['Bank', bankNames[this.bankCode] || this.bankCode || '—'],
          ['Branch', this.bankBranch || '—'],
        ],
      });
    }

    const docRows: [string, string][] = Object.keys(this.docs)
      .filter(k => this.docs[k])
      .map(k => [docLabels[k] || k, 'Uploaded ✓']);
    sections.push({ title: 'Documents Uploaded', rows: docRows });

    return sections;
  }

  // ── Methods ───────────────────────────────────────────────────────────────
  showToast(text: string, type: 'success' | 'error' | 'info' = 'info'): void {
    this.toast = { text, type };
    setTimeout(() => (this.toast = null), 4500);
  }

  setUserType(type: string): void {
    this.userType = type;
    this.touchedAll = false;
  }

  handleNext(): void {
    this.touchedAll = true;

    // Debug: Log all form data
    console.log('═══════════════════════════════════════');
    console.log('🔄 ATTEMPTING TO PROCEED FROM STEP', this.step);
    console.log('User Type:', this.userType);
    console.log('═══════════════════════════════════════');

    // Log all relevant fields based on step
    if (this.step === 1) {
      console.log('📝 STEP 1 VALIDATION CHECK:');
      console.log('  ✓ fullName:', this.fullName, '| valid:', this.fullName && this.fullName.length >= 3);
      console.log('  ✓ email:', this.email, '| valid:', this.email && this.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/));
      console.log('  ✓ phone:', this.phone, '| valid:', this.phone && this.phone.match(/^(07|01|254)[0-9]{8,9}$/));

      if (this.userType !== 'TENANT') {
        console.log('  ✓ idNumber:', this.idNumber, '| valid:', this.idNumber && this.idNumber.match(/^[0-9]{6,8}$/));
        console.log('  ✓ kraPin:', this.kraPin, '| valid:', this.kraPin && this.kraPin.match(/^[A-Z][0-9]{9}[A-Z]$/));
      }

      if (this.userType === 'CORPORATE_LANDLORD') {
        console.log('  ✓ companyName:', this.companyName, '| valid:', !!this.companyName?.trim());
        console.log('  ✓ regNumber:', this.regNumber, '| valid:', !!this.regNumber?.trim());
      }

      if (this.userType === 'SACCO') {
        console.log('  ✓ saccoName:', this.saccoName, '| valid:', !!this.saccoName?.trim());
        console.log('  ✓ saccoLic:', this.saccoLic, '| valid:', !!this.saccoLic?.trim());
      }
    }

    if (this.step === 2 && this.userType !== 'TENANT') {
      console.log('🏦 STEP 2 VALIDATION CHECK:');
      console.log('  ✓ bankName:', this.bankName, '| valid:', !!this.bankName?.trim());
      console.log('  ✓ bankAccNum:', this.bankAccNum, '| valid:', this.bankAccNum && this.bankAccNum.match(/^[0-9]{10,16}$/));
      console.log('  ✓ bankCode:', this.bankCode, '| valid:', !!this.bankCode);
      console.log('  ✓ bankBranch:', this.bankBranch, '| valid:', !!this.bankBranch?.trim());
      console.log('  ✓ terms:', this.terms, '| valid:', this.terms === true);
    }

    const docStep = this.userType === 'TENANT' ? 2 : 3;
    if (this.step === docStep) {
      console.log('📄 DOCUMENTS VALIDATION CHECK:');
      console.log('  Current docs:', Object.keys(this.docs));
      console.log('  Required docs for', this.userType + ':');

      switch (this.userType) {
        case 'INDIVIDUAL_LANDLORD':
          console.log('  ✓ idFront:', !!this.docs['idFront']);
          console.log('  ✓ idBack:', !!this.docs['idBack']);
          console.log('  ✓ selfie:', !!this.docs['selfie']);
          console.log('  ✓ proofOfResidence:', !!this.docs['proofOfResidence']);
          break;
        case 'CORPORATE_LANDLORD':
          console.log('  ✓ incorporation:', !!this.docs['incorporation']);
          console.log('  ✓ cr12:', !!this.docs['cr12']);
          console.log('  ✓ bizAddress:', !!this.docs['bizAddress']);
          console.log('  ✓ boardRes:', !!this.docs['boardRes']);
          break;
        case 'SACCO':
          console.log('  ✓ saccoLic:', !!this.docs['saccoLic']);
          console.log('  ✓ saccoBylaws:', !!this.docs['saccoBylaws']);
          console.log('  ✓ bizAddress:', !!this.docs['bizAddress']);
          break;
        case 'TENANT':
          console.log('  ✓ idFront:', !!this.docs['idFront']);
          console.log('  ✓ selfie:', !!this.docs['selfie']);
          break;
      }
    }

    // Get errors and log them
    const errorList = this.errors;
    const errorKeys = Object.keys(errorList);

    console.log('═══════════════════════════════════════');
    console.log('❌ VALIDATION ERRORS FOUND:', errorKeys.length);
    if (errorKeys.length > 0) {
      console.log('Detailed errors:');
      errorKeys.forEach(key => {
        console.log(`  → ${key}: "${errorList[key]}"`);
      });
    }
    console.log('═══════════════════════════════════════');

    if (errorKeys.length) {
      this.showToast(`Please complete: ${errorKeys.join(', ')}`, 'error');
      return;
    }

    console.log('✅ VALIDATION PASSED! Proceeding...');

    if (this.step < this.totalSteps) {
      this.step++;
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      this.handleSubmit();
    }
  }

  checkWhyNotWorking(): void {
    console.log('=== CAN I CONTINUE? ===');
    console.log('Step:', this.step);
    console.log('User Type:', this.userType);

    // Manually check each required field
    if (this.step === 1) {
      console.log('fullName:', this.fullName, this.fullName?.length >= 3 ? '✅' : '❌');
      console.log('email:', this.email, this.email?.includes('@') ? '✅' : '❌');
      console.log('phone:', this.phone, 'length:', this.phone?.length, this.phone?.length >= 10 ? '✅' : '❌');

      if (this.userType !== 'TENANT') {
        console.log('idNumber:', this.idNumber, this.idNumber?.length >= 6 ? '✅' : '❌');
        console.log('kraPin:', this.kraPin, this.kraPin?.length >= 11 ? '✅' : '❌');
      }

      if (this.userType === 'CORPORATE_LANDLORD') {
        console.log('companyName:', this.companyName, this.companyName ? '✅' : '❌');
        console.log('regNumber:', this.regNumber, this.regNumber ? '✅' : '❌');
      }

      if (this.userType === 'SACCO') {
        console.log('saccoName:', this.saccoName, this.saccoName ? '✅' : '❌');
        console.log('saccoLic:', this.saccoLic, this.saccoLic ? '✅' : '❌');
      }
    }

    if (this.step === 2 && this.userType !== 'TENANT') {
      console.log('bankName:', this.bankName, this.bankName ? '✅' : '❌');
      console.log('bankAccNum:', this.bankAccNum, this.bankAccNum?.length >= 10 ? '✅' : '❌');
      console.log('bankCode:', this.bankCode, this.bankCode ? '✅' : '❌');
      console.log('bankBranch:', this.bankBranch, this.bankBranch ? '✅' : '❌');
      console.log('terms:', this.terms, this.terms ? '✅' : '❌');
    }

    const errors = this.errors;
    console.log('Validation errors:', errors);
    console.log('Has errors:', Object.keys(errors).length > 0);

    if (Object.keys(errors).length > 0) {
      alert('Cannot continue! Missing: ' + Object.keys(errors).join(', '));
    } else {
      alert('All validations passed! You should be able to continue.');
    }
  }

  handleBack(): void {
    if (this.step > 1) {
      this.step--;
      this.touchedAll = false;
    }
  }

  handleSubmit(): void {
    this.loading = true;
    const payload = {
      userType: this.userType,
      fullName: this.fullName,
      email: this.email,
      phone: this.phone,
      idNumber: this.idNumber,
      kraPin: this.kraPin,
      companyName: this.companyName,
      regNumber: this.regNumber,
      saccoName: this.saccoName,
      saccoLic: this.saccoLic,
      licenseNumber: this.licenseNumber,
      physicalAddress: this.physicalAddress,
      city: this.city,
      county: this.county,
      website: this.website,
      directors: this.directors,
      owners: this.owners,
      trustees: this.trustees,
      bankName: this.bankOptions.find(b => b.value === this.bankCode)?.label || this.bankName,
      bankAccNum: this.bankAccNum,
      bankCode: this.bankCode,
      bankBranch: this.bankBranch,
      terms: this.terms,
      docs: this.docs,
      pin: this.pin
    };

    const request$ = this.isAgentRegistration
      ? this.onboardingService.submitAgentOnboarding(payload)
      : this.onboardingService.submitLandlordOnboarding(payload);

    request$.subscribe({
      next: () => {
        this.loading = false;
        this.showSuccess = true;
      },
      error: (err) => {
        this.loading = false;
        this.showToast(err.message || 'Submission failed', 'error');
      }
    });
  }

  handleFile(field: string, event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      this.showToast('File too large (max 5MB)', 'error');
      input.value = '';
      return;
    }
    const allowed = ['image/jpeg', 'image/png', 'application/pdf'];
    if (!allowed.includes(file.type)) {
      this.showToast('Only JPEG, PNG or PDF files are allowed', 'error');
      input.value = '';
      return;
    }
    const reader = new FileReader();
    reader.onload = ev => {
      this.docs = { ...this.docs, [field]: ev.target?.result as string };
    };
    reader.readAsDataURL(file);
  }

  clearDoc(field: string): void {
    this.docs = { ...this.docs, [field]: null };
  }

  // Directors
  addDirector(): void { this.directors = [...this.directors, { name: '', id: '', kra: '' }]; }
  removeDirector(i: number): void { this.directors = this.directors.filter((_, j) => j !== i); }
  updateDirector(i: number, key: keyof Director, v: string): void {
    const a = [...this.directors]; a[i] = { ...a[i], [key]: v }; this.directors = a;
  }

  // Beneficial owners
  addOwner(): void { this.owners = [...this.owners, { name: '', id: '', pct: '' }]; }
  removeOwner(i: number): void { this.owners = this.owners.filter((_, j) => j !== i); }
  updateOwner(i: number, key: keyof Owner, v: string): void {
    const a = [...this.owners]; a[i] = { ...a[i], [key]: v }; this.owners = a;
  }

  // Trustees
  addTrustee(): void { this.trustees = [...this.trustees, { name: '', id: '', kra: '' }]; }
  removeTrustee(i: number): void { this.trustees = this.trustees.filter((_, j) => j !== i); }
  updateTrustee(i: number, key: keyof Trustee, v: string): void {
    const a = [...this.trustees]; a[i] = { ...a[i], [key]: v }; this.trustees = a;
  }

  goToDashboard(): void {
    const registered = this.isAgentRegistration ? 'agent' : 'landlord';
    this.router.navigate(['/auth/login'], { queryParams: { registered } });
  }

  trackByIndex(i: number): number { return i; }
}
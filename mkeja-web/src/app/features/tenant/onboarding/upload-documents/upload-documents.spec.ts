import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { TenantOnboardingUploadDocumentsComponent } from './upload-documents';
import { TenantService } from '../../../../core/services/tenant';
import { AuthService } from '../../../../core/services/auth';

describe('TenantOnboardingUploadDocumentsComponent', () => {
  let component: TenantOnboardingUploadDocumentsComponent;
  let fixture: ComponentFixture<TenantOnboardingUploadDocumentsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TenantOnboardingUploadDocumentsComponent],
      providers: [
        provideRouter([]),
        {
          provide: TenantService,
          useValue: {
            getMyOnboardingContext: () => of({ tenantId: '1', kycStatus: 'PENDING', documentsComplete: false }),
            uploadKycDocuments: () => of({ kycStatus: 'MANUAL_REVIEW', message: 'ok', documentsUploaded: [] })
          }
        },
        {
          provide: AuthService,
          useValue: { isAuthenticated: () => false, updateKycStatus: () => undefined }
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(TenantOnboardingUploadDocumentsComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

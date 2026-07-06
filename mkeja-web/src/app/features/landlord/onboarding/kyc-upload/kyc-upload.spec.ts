import { ComponentFixture, TestBed } from '@angular/core/testing';

import { KycUpload } from './kyc-upload';

describe('KycUpload', () => {
  let component: KycUpload;
  let fixture: ComponentFixture<KycUpload>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [KycUpload],
    }).compileComponents();

    fixture = TestBed.createComponent(KycUpload);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

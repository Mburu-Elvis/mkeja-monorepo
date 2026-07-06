import { ComponentFixture, TestBed } from '@angular/core/testing';

import { KycDocs } from './kyc-docs';

describe('KycDocs', () => {
  let component: KycDocs;
  let fixture: ComponentFixture<KycDocs>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [KycDocs],
    }).compileComponents();

    fixture = TestBed.createComponent(KycDocs);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RatibaConsent } from './ratiba-consent';

describe('RatibaConsent', () => {
  let component: RatibaConsent;
  let fixture: ComponentFixture<RatibaConsent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RatibaConsent],
    }).compileComponents();

    fixture = TestBed.createComponent(RatibaConsent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

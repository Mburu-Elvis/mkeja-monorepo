import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VerifyIdentity } from './verify-identity';

describe('VerifyIdentity', () => {
  let component: VerifyIdentity;
  let fixture: ComponentFixture<VerifyIdentity>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VerifyIdentity],
    }).compileComponents();

    fixture = TestBed.createComponent(VerifyIdentity);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

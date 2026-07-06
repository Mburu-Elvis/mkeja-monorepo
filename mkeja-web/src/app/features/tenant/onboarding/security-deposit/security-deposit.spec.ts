import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SecurityDeposit } from './security-deposit';

describe('SecurityDeposit', () => {
  let component: SecurityDeposit;
  let fixture: ComponentFixture<SecurityDeposit>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SecurityDeposit],
    }).compileComponents();

    fixture = TestBed.createComponent(SecurityDeposit);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

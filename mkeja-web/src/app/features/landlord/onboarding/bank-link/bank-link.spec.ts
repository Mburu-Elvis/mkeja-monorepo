import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BankLink } from './bank-link';

describe('BankLink', () => {
  let component: BankLink;
  let fixture: ComponentFixture<BankLink>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BankLink],
    }).compileComponents();

    fixture = TestBed.createComponent(BankLink);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

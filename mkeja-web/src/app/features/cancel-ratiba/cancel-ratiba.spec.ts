import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CancelRatiba } from './cancel-ratiba';

describe('CancelRatiba', () => {
  let component: CancelRatiba;
  let fixture: ComponentFixture<CancelRatiba>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CancelRatiba],
    }).compileComponents();

    fixture = TestBed.createComponent(CancelRatiba);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

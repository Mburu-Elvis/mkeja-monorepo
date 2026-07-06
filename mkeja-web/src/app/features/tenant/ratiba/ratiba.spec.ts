import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Ratiba } from './ratiba';

describe('Ratiba', () => {
  let component: Ratiba;
  let fixture: ComponentFixture<Ratiba>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Ratiba],
    }).compileComponents();

    fixture = TestBed.createComponent(Ratiba);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

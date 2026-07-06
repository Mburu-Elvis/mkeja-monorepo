import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Reconcile } from './reconcile';

describe('Reconcile', () => {
  let component: Reconcile;
  let fixture: ComponentFixture<Reconcile>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Reconcile],
    }).compileComponents();

    fixture = TestBed.createComponent(Reconcile);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

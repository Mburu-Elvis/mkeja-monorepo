import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProgressCard } from './progress-card';

describe('ProgressCard', () => {
  let component: ProgressCard;
  let fixture: ComponentFixture<ProgressCard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProgressCard],
    }).compileComponents();

    fixture = TestBed.createComponent(ProgressCard);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

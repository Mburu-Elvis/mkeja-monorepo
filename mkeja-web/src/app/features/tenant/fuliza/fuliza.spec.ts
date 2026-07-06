import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Fuliza } from './fuliza';

describe('Fuliza', () => {
  let component: Fuliza;
  let fixture: ComponentFixture<Fuliza>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Fuliza],
    }).compileComponents();

    fixture = TestBed.createComponent(Fuliza);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddUnit } from './add-unit';

describe('AddUnit', () => {
  let component: AddUnit;
  let fixture: ComponentFixture<AddUnit>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddUnit],
    }).compileComponents();

    fixture = TestBed.createComponent(AddUnit);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

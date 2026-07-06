import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UploadCard } from './upload-card';

describe('UploadCard', () => {
  let component: UploadCard;
  let fixture: ComponentFixture<UploadCard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UploadCard],
    }).compileComponents();

    fixture = TestBed.createComponent(UploadCard);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

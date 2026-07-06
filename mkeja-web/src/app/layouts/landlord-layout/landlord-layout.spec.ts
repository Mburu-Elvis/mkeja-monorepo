import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { LandlordLayoutComponent } from './landlord-layout';

describe('LandlordLayoutComponent', () => {
  let component: LandlordLayoutComponent;
  let fixture: ComponentFixture<LandlordLayoutComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LandlordLayoutComponent],
      providers: [provideRouter([])]
    }).compileComponents();

    fixture = TestBed.createComponent(LandlordLayoutComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

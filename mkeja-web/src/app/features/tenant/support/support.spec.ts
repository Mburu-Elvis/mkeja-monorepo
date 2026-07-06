import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { of } from 'rxjs';
import { SupportComponent } from './support';
import { SupportService } from '../../../core/services/support.service';

describe('SupportComponent', () => {
  let component: SupportComponent;
  let fixture: ComponentFixture<SupportComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SupportComponent],
      providers: [
        provideRouter([]),
        { provide: MatSnackBar, useValue: { open: jasmine.createSpy('open') } },
        {
          provide: SupportService,
          useValue: {
            getTickets: () => of([]),
            createTicket: () => of({}),
            replyToTicket: () => of({})
          }
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(SupportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

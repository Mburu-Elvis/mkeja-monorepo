import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { TenantLayoutComponent } from './tenant-layout';
import { AuthService } from '../../core/services/auth';

describe('TenantLayoutComponent', () => {
  let component: TenantLayoutComponent;
  let fixture: ComponentFixture<TenantLayoutComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TenantLayoutComponent],
      providers: [
        provideRouter([]),
        {
          provide: AuthService,
          useValue: {
            getCurrentUser: () => null,
            isAuthenticated: () => false,
            refreshToken: () => ({ subscribe: () => undefined }),
            logout: () => undefined
          }
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(TenantLayoutComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

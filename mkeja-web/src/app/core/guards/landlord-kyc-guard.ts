import { Injectable } from '@angular/core';
import {
  Router,
  CanActivate,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
  UrlTree
} from '@angular/router';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { AuthService, User } from '../services/auth';

@Injectable({
  providedIn: 'root'
})
export class LandlordKycGuard implements CanActivate {

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(
    _route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean | UrlTree> | boolean | UrlTree {
    if (!this.authService.isAuthenticated()) {
      return this.router.createUrlTree(['/auth/login'], {
        queryParams: { returnUrl: state.url }
      });
    }

    const cached = this.authService.getCurrentUser();
    if (!cached || !this.isLandlordOrAgent(cached)) {
      return this.router.createUrlTree(['/unauthorized']);
    }

    return this.authService.refreshToken().pipe(
      map(response => this.allowIfApproved(this.authService.getUserFromResponse(response), state)),
      catchError(() => of(this.allowIfApproved(this.authService.getCurrentUser(), state)))
    );
  }

  private allowIfApproved(user: User | null, state: RouterStateSnapshot): boolean | UrlTree {
    if (!user || !this.isLandlordOrAgent(user)) {
      return this.router.createUrlTree(['/unauthorized']);
    }
    if (user.kycStatus !== 'APPROVED') {
      const dashboard = user.role === 'AGENT' ? '/agent/dashboard' : '/landlord/dashboard';
      return this.router.createUrlTree([dashboard], {
        queryParams: { kyc: 'required' }
      });
    }
    return true;
  }

  private isLandlordOrAgent(user: User): boolean {
    return user.role === 'LANDLORD' || user.role === 'AGENT';
  }
}

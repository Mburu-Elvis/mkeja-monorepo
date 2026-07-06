import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpService } from './http';
import { TenantTenancyItem } from './landlord.service';

export interface TenantTenancyHistory {
  tenancies: TenantTenancyItem[];
}

@Injectable({ providedIn: 'root' })
export class TenantTenancyService {
  constructor(private http: HttpService) {}

  getTenancyHistory(): Observable<TenantTenancyHistory> {
    return this.http.get<TenantTenancyHistory>('/auth/tenant/tenancies');
  }
}

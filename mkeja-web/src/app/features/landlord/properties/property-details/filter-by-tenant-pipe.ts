import { Pipe, PipeTransform } from '@angular/core';
import { Payment } from './property-details';

@Pipe({
  name: 'filterByTenant',
  standalone: true
})
export class FilterByTenantPipe implements PipeTransform {
  transform(payments: Payment[] | null | undefined, tenantId: string | null | undefined): Payment[] {
    if (!payments || !tenantId) {
      return [];
    }
    return payments.filter(payment => payment.tenantId === tenantId);
  }
}
import { Pipe, PipeTransform } from '@angular/core';
import { MaintenanceIssue } from './property-details';

@Pipe({
  name: 'filterByStatus',
  standalone: true
})
export class FilterByStatusPipe implements PipeTransform {
  transform(issues: MaintenanceIssue[], statuses: string): MaintenanceIssue[] {
    if (!issues || !statuses) return [];
    
    const statusArray = statuses.split(',');
    return issues.filter(issue => statusArray.includes(issue.status));
  }
}
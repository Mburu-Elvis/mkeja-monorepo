import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-progress-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './progress-card.html',
  styleUrls: ['./progress-card.css']
})
export class ProgressCardComponent {
  @Input() unitName = '';
  @Input() landlordName = '';
  @Input() paid = 0;
  @Input() total = 0;
  @Input() dueDate = new Date();
  @Input() paymentPlan = 'Daily';
  @Input() statusClass: 'success' | 'warning' | 'danger' = 'success';
  @Input() statusText = 'On Track';

  get percentComplete(): number {
    return (this.paid / this.total) * 100;
  }
}
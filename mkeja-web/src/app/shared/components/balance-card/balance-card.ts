import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-balance-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './balance-card.html',
  styleUrls: ['./balance-card.css']
})
export class BalanceCardComponent {
  @Input() label = 'Available Balance';
  @Input() balance = 0;
  @Input() subText = '';
  @Input() showAction = false;
  @Input() actionText = 'Top Up';
  @Input() loading = false;
  
  @Output() actionClick = new EventEmitter<void>();
}
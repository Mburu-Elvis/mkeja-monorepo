import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface Transaction {
  id: string;
  type: 'CREDIT' | 'DEBIT';
  description: string;
  amount: number;
  date: Date;
  status: 'SUCCESS' | 'PENDING' | 'FAILED';
  reference?: string;
}

@Component({
  selector: 'app-transaction-item',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './transaction-item.html',
  styleUrls: ['./transaction-item.css']
})
export class TransactionItemComponent {
  @Input() transaction!: Transaction;
}
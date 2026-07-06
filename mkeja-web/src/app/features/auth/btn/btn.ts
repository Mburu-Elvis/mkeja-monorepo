import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-btn',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './btn.html',
  styleUrls: ['./btn.css']
})
export class BtnComponent {
  @Input() variant: 'primary' | 'secondary' | 'outline' | 'ghost' | 'success' | 'danger' | 'warning' = 'primary';
  @Input() disabled = false;
  @Input() full = false;
  @Output() onClick = new EventEmitter<void>();

  hov = false;
}
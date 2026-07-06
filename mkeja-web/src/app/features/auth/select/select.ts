import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-select',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './select.html',
  styleUrls: ['./select.css']
})
export class SelectComponent {
  @Input() value = "";
  @Output() valueChange = new EventEmitter<string>();
  @Input() options: { value: string; label: string }[] = [];
  @Input() placeholder = "";

  focused = false;

  onChange(event: Event): void {
    this.valueChange.emit((event.target as HTMLSelectElement).value);
  }
}
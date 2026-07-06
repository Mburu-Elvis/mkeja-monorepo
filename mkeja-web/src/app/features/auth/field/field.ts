// field.component.ts
import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-field',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './field.html',
  styleUrls: ['./field.css']
})
export class FieldComponent {
  @Input() label: string | null | undefined = "";
  @Input() error: string | null | false = "";
}
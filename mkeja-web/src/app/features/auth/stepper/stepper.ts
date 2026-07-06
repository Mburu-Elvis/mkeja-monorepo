import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-stepper',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './stepper.html',
  styleUrls: ['./stepper.css']
})
export class StepperComponent {
  @Input() current = 1;
  @Input() total = 4;
  @Input() labels: string[] = [];

  get steps(): number[] {
    return Array.from({ length: this.total }, (_, i) => i + 1);
  }
}
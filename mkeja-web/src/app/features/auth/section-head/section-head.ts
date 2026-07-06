import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-section-head',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './section-head.html',
  styleUrls: ['./section-head.css']
})
export class SectionHeadComponent {
  @Input() label = "";
}
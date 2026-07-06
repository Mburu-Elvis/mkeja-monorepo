import { Component, Input, Output, EventEmitter, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-upload-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './upload-card.html',
  styleUrls: ['./upload-card.css']
})
export class UploadCardComponent {
  @Input() label = "";
  @Input() icon = "";
  @Input() preview: string | null = null;
  @Input() hint = "";
  @Output() upload = new EventEmitter<Event>();
  @Output() clear = new EventEmitter<void>();

  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;
  hover = false;

  triggerUpload(): void {
    this.fileInput.nativeElement.click();
  }

  onMouseEnter(): void {
    this.hover = true;
  }

  onMouseLeave(): void {
    this.hover = false;
  }
}
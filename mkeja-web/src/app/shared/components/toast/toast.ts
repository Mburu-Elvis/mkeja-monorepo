import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './toast.html',
  styleUrls: ['./toast.css']
})
export class ToastComponent implements OnInit, OnDestroy {
  show(arg0: string, arg1: string) {
    throw new Error('Method not implemented.');
  }
  @Input() type: ToastType = 'info';
  @Input() message = '';
  @Input() duration = 3000;
  @Output() close = new EventEmitter<void>();
  
  visible = true;
  private timeout: any;

  ngOnInit() {
    this.timeout = setTimeout(() => {
      this.dismiss();
    }, this.duration);
  }

  dismiss() {
    this.visible = false;
    this.close.emit();
  }

  getIcon(): string {
    switch (this.type) {
      case 'success': return '✓';
      case 'error': return '✗';
      case 'warning': return '⚠';
      default: return 'ℹ';
    }
  }

  ngOnDestroy() {
    if (this.timeout) clearTimeout(this.timeout);
  }
}
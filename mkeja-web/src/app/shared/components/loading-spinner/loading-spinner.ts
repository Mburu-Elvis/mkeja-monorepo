import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-loading-spinner',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (fullScreen) {
      <div class="spinner-fullscreen">
        <div class="spinner"></div>
        @if (message) {
          <p>{{ message }}</p>
        }
      </div>
    } @else {
      <div class="spinner-inline">
        <div class="spinner-small"></div>
        @if (message) {
          <span>{{ message }}</span>
        }
      </div>
    }
  `,
  styles: [`
    .spinner-fullscreen {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0,0,0,0.5);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    }
    .spinner {
      width: 48px;
      height: 48px;
      border: 4px solid rgba(255,255,255,0.3);
      border-top-color: white;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }
    .spinner-fullscreen p {
      color: white;
      margin-top: 16px;
    }
    .spinner-inline {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .spinner-small {
      width: 20px;
      height: 20px;
      border: 2px solid #00A859;
      border-top-color: transparent;
      border-radius: 50%;
      animation: spin 0.6s linear infinite;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `]
})
export class LoadingSpinnerComponent {
  @Input() fullScreen = false;
  @Input() message = '';
}
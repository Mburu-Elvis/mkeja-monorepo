import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-auth-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet],
  template: `
    <div class="auth-layout" [class.onboarding-mode]="layoutMode === 'onboarding'">
      <div class="auth-status-strip"></div>

      <div class="auth-background">
        <div class="auth-orb auth-orb-1"></div>
        <div class="auth-orb auth-orb-2"></div>
      </div>

      <div
        class="auth-container"
        [class.onboarding-width]="layoutMode === 'onboarding'"
        [class.register-width]="layoutMode === 'register'">
        <div class="auth-card-wrapper">
          <router-outlet></router-outlet>
        </div>

        <footer class="auth-footer">
          <p>&copy; 2026 Mkeja · Secure rent management</p>
        </footer>
      </div>
    </div>
  `,
  styles: [`
    .auth-layout {
      min-height: 100vh;
      background: var(--sf-bg, #F9FAFB);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px;
      font-family: var(--font-sans, 'Nunito Sans', sans-serif);
      position: relative;
      overflow: hidden;
    }

    .auth-layout.onboarding-mode {
      align-items: flex-start;
      padding-top: 32px;
      padding-bottom: 32px;
    }

    .auth-status-strip {
      height: 3px;
      background: linear-gradient(90deg, var(--primary-color, #0F4C3A), var(--brand-accent-light, #81C784), var(--primary-dark, #0A3528));
      width: 100%;
      position: fixed;
      top: 0;
      left: 0;
      z-index: 1000;
    }

    .auth-background {
      position: absolute;
      inset: 0;
      pointer-events: none;
      z-index: 0;
    }

    .auth-orb {
      position: absolute;
      border-radius: 50%;
      filter: blur(80px);
      opacity: 0.35;
    }

    .auth-orb-1 {
      width: 420px;
      height: 420px;
      background: radial-gradient(circle, var(--brand-accent, #4CAF50) 0%, transparent 70%);
      top: -120px;
      left: -100px;
    }

    .auth-orb-2 {
      width: 480px;
      height: 480px;
      background: radial-gradient(circle, var(--primary-dark, #0A3528) 0%, transparent 70%);
      bottom: -160px;
      right: -120px;
    }

    .auth-container {
      width: 100%;
      max-width: 480px;
      position: relative;
      z-index: 1;
    }

    .auth-container.onboarding-width {
      max-width: 920px;
    }

    .auth-container.register-width {
      max-width: 960px;
    }

    .auth-card-wrapper {
      animation: authLayoutFadeIn 0.55s cubic-bezier(0.16, 1, 0.3, 1);
    }

    .auth-footer {
      text-align: center;
      margin-top: 24px;
    }

    .auth-footer p {
      font-size: 11px;
      color: var(--sf-text-4, #9CA3AF);
      font-weight: 600;
      letter-spacing: 0.5px;
    }

    @keyframes authLayoutFadeIn {
      from { opacity: 0; transform: translateY(18px); }
      to { opacity: 1; transform: translateY(0); }
    }

    @media (min-width: 1024px) {
      .auth-layout:not(.onboarding-mode) {
        padding: 40px 48px;
      }

      .auth-container.register-width {
        max-width: 1040px;
      }
    }
  `]
})
export class AuthLayoutComponent {
  private readonly router = inject(Router);

  get layoutMode(): 'onboarding' | 'register' | 'default' {
    const url = this.router.url;
    if (url.includes('/onboarding')) {
      return 'onboarding';
    }
    if (url.includes('/register')) {
      return 'register';
    }
    return 'default';
  }
}

import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { MatIconModule, MatIconRegistry } from '@angular/material/icon';
import { DomSanitizer } from '@angular/platform-browser';

@Component({
  selector: 'app-agent-coming-soon',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule],
  templateUrl: './coming-soon.html',
  styleUrls: ['./coming-soon.css']
})
export class AgentComingSoonComponent {
  private route = inject(ActivatedRoute);
  private iconRegistry = inject(MatIconRegistry);
  private sanitizer = inject(DomSanitizer);

  readonly title = this.route.snapshot.data['title'] as string || 'Coming soon';
  readonly description = this.route.snapshot.data['description'] as string
    || 'This agent function is on the roadmap and will be available in a future release.';

  constructor() {
    const svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>';
    this.iconRegistry.addSvgIconLiteral('clock', this.sanitizer.bypassSecurityTrustHtml(svg));
  }
}

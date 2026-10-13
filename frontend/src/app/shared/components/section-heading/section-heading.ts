import { Component, input } from '@angular/core';

@Component({
  selector: 'app-section-heading',
  styleUrl: './section-heading.scss',
  templateUrl: './section-heading.html',
})
export class SectionHeading {
  readonly eyebrow = input.required<string>();
  readonly title = input.required<string>();
  readonly description = input<string>();
  readonly align = input<'left' | 'center'>('center');
}

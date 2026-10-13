import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SITE } from '../../../core/site';

@Component({
  imports: [RouterLink],
  selector: 'app-logo',
  styleUrl: './logo.scss',
  templateUrl: './logo.html',
})
export class Logo {
  protected readonly site = SITE;
  /** Показывать подпись под логотипом. */
  readonly showTagline = input(false);
}

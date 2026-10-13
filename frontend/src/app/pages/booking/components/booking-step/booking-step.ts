import { Component, input } from '@angular/core';

/** Карточка шага бронирования: номер, заголовок, подсказка и произвольный контент. */
@Component({
  selector: 'app-booking-step',
  styleUrl: './booking-step.scss',
  templateUrl: './booking-step.html',
})
export class BookingStep {
  readonly step = input.required<string>();
  readonly title = input.required<string>();
  readonly hint = input<string>();
  /** Шаг заполнен — вместо номера показываем галочку. */
  readonly done = input(false);
}

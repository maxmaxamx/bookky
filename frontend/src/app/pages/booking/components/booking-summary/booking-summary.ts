import { Component, computed, input } from '@angular/core';
import { SITE } from '../../../../core/site';
import { formatDateLong, guestsLabel } from '../../../../core/utils/date.util';

@Component({
  selector: 'app-booking-summary',
  styleUrl: './booking-summary.scss',
  templateUrl: './booking-summary.html',
})
export class BookingSummary {
  readonly date = input.required<Date>();
  readonly time = input<string | null>(null);
  readonly guests = input.required<number>();
  readonly table = input<string | null>(null);

  protected readonly site = SITE;

  protected readonly dateLabel = computed(() => formatDateLong(this.date()));
  protected readonly isReady = computed(() => !!this.time());

  protected readonly rows = computed(() => [
    { label: 'Дата', value: this.dateLabel(), filled: true },
    { label: 'Время', value: this.time() ?? 'не выбрано', filled: !!this.time() },
    { label: 'Гости', value: guestsLabel(this.guests()), filled: true },
    { label: 'Стол', value: this.table() ?? 'не выбран', filled: !!this.table() },
    { label: 'Длительность', value: '2 часа', filled: true },
    { label: 'Депозит', value: 'не требуется', filled: true },
  ]);

  /** Прогресс выбора даты, времени, гостей и столика. */
  protected readonly progress = computed(() => {
    const steps = [true, !!this.time(), true, !!this.table()];
    return `${Math.round((steps.filter(Boolean).length / steps.length) * 100)}%`;
  });
}

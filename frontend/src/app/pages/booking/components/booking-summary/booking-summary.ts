import { Component, computed, input } from '@angular/core';
import { PreorderItem } from '../../../../core/models/booking.model';
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
  readonly preorder = input<PreorderItem[]>([]);

  protected readonly site = SITE;

  protected readonly dateLabel = computed(() => formatDateLong(this.date()));
  protected readonly isReady = computed(() => !!this.time());

  protected readonly preorderCount = computed(() =>
    this.preorder().reduce((acc, item) => acc + item.quantity, 0),
  );

  protected readonly preorderTotal = computed(() =>
    this.preorder().reduce((acc, item) => acc + item.price * item.quantity, 0),
  );

  protected readonly rows = computed(() => {
    const list = [
      { label: 'Дата', value: this.dateLabel(), filled: true },
      { label: 'Время', value: this.time() ?? 'не выбрано', filled: !!this.time() },
      { label: 'Гости', value: guestsLabel(this.guests()), filled: true },
      { label: 'Стол', value: this.table() ?? 'не выбран', filled: !!this.table() },
      { label: 'Длительность', value: '2 часа', filled: true },
      { label: 'Депозит', value: 'не требуется', filled: true },
    ];

    if (this.preorderCount() > 0) {
      list.push({
        label: 'Предзаказ блюд',
        value: `${this.preorderCount()} поз. (${new Intl.NumberFormat('ru-RU').format(this.preorderTotal())} ₽)`,
        filled: true,
      });
    }

    return list;
  });

  /** Прогресс выбора даты, времени, гостей и столика. */
  protected readonly progress = computed(() => {
    const steps = [true, !!this.time(), true, !!this.table()];
    return `${Math.round((steps.filter(Boolean).length / steps.length) * 100)}%`;
  });
}


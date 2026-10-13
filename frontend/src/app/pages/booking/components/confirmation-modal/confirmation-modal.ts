import {
  Component,
  ElementRef,
  computed,
  effect,
  input,
  model,
  output,
  viewChild,
} from '@angular/core';
import { BookingConfirmation } from '../../../../core/models/booking.model';
import { SITE } from '../../../../core/site';
import { formatDateLong, fromIsoDate, guestsLabel } from '../../../../core/utils/date.util';

@Component({
  selector: 'app-confirmation-modal',
  styleUrl: './confirmation-modal.scss',
  templateUrl: './confirmation-modal.html',
  host: { '(document:keydown.escape)': 'close()' },
})
export class ConfirmationModal {
  /** Двусторонняя привязка видимости модалки. */
  readonly open = model(false);
  readonly confirmation = input<BookingConfirmation | null>(null);
  /** Сообщаем родителю, что бронь можно сбросить. */
  readonly closed = output<void>();

  protected readonly site = SITE;

  private readonly doneButton = viewChild<ElementRef<HTMLButtonElement>>('doneButton');

  protected readonly rows = computed(() => {
    const booking = this.confirmation();
    if (!booking) {
      return [];
    }
    return [
      { label: 'Номер брони', value: booking.id },
      { label: 'Дата', value: formatDateLong(fromIsoDate(booking.date)) },
      { label: 'Время', value: booking.time },
      { label: 'Гости', value: guestsLabel(booking.guests) },
      { label: 'Стол', value: booking.table },
      { label: 'Имя', value: booking.name },
      { label: 'Телефон', value: booking.phone },
    ];
  });

  constructor() {
    // Пока модалка открыта — блокируем прокрутку страницы.
    effect((onCleanup) => {
      if (!this.open()) {
        return;
      }
      const previous = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      onCleanup(() => {
        document.body.style.overflow = previous;
      });
    });

    // Переводим фокус на кнопку закрытия для доступности.
    effect(() => {
      if (this.open()) {
        this.doneButton()?.nativeElement.focus();
      }
    });
  }

  protected close(): void {
    if (!this.open()) {
      return;
    }
    this.open.set(false);
    this.closed.emit();
  }
}

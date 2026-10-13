import {
  Component,
  DestroyRef,
  computed,
  effect,
  inject,
  input,
  model,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  BANQUET_THRESHOLD,
  SLOT_PERIOD_LABELS,
  TimeSlot,
} from '../../../../core/models/booking.model';
import { BookingService } from '../../../../core/services/booking.service';
import { plural } from '../../../../core/utils/date.util';

@Component({
  selector: 'app-time-slots',
  styleUrl: './time-slots.scss',
  templateUrl: './time-slots.html',
})
export class TimeSlots {
  readonly date = input.required<Date>();
  readonly guests = input(2);
  /** Выбранное время в формате HH:mm. */
  readonly selected = model<string | null>(null);

  private readonly bookingService = inject(BookingService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly loading = signal(true);
  protected readonly loadError = signal(false);
  protected readonly slots = signal<readonly TimeSlot[]>([]);
  protected readonly placeholders = Array.from({ length: 10 }, (_, index) => index);
  protected readonly periodLabels = SLOT_PERIOD_LABELS;

  protected readonly daySlots = computed(() =>
    this.slots().filter((slot) => slot.period === 'day'),
  );
  protected readonly eveningSlots = computed(() =>
    this.slots().filter((slot) => slot.period === 'evening'),
  );
  protected readonly isClosed = computed(() => !this.loading() && this.slots().length === 0);
  protected readonly hasAvailable = computed(() => this.slots().some((slot) => slot.available));
  protected readonly banquetNote = computed(() => this.guests() >= BANQUET_THRESHOLD);

  constructor() {
    // При смене даты заново запрашиваем слоты и сбрасываем выбор времени.
    effect(() => {
      const date = this.date();
      this.loading.set(true);
      this.loadError.set(false);
      this.selected.set(null);

      this.bookingService
        .getSlots(date)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (slots) => {
            this.slots.set(slots);
            this.loading.set(false);
          },
          error: () => {
            this.slots.set([]);
            this.loadError.set(true);
            this.loading.set(false);
          },
        });
    });
  }

  protected toggle(slot: TimeSlot): void {
    if (!slot.available) {
      return;
    }
    this.selected.set(this.selected() === slot.time ? null : slot.time);
  }

  protected slotClass(slot: TimeSlot): string {
    if (!slot.available) {
      return 'ts-slot ts-slot--busy';
    }
    return this.selected() === slot.time ? 'ts-slot ts-slot--on' : 'ts-slot ts-slot--free';
  }

  protected slotHint(slot: TimeSlot): string {
    if (!slot.available) {
      return 'занято';
    }
    return plural(slot.tablesLeft, ['столик', 'столика', 'столиков']);
  }
}

import { Component, computed, effect, inject, input, model, signal } from '@angular/core';
import { RestaurantTable } from '../../../../core/models/booking.model';
import { guestsLabel } from '../../../../core/utils/date.util';
import { BookingService } from '../../../../core/services/booking.service';

@Component({
  selector: 'app-table-picker',
  styleUrl: './table-picker.scss',
  templateUrl: './table-picker.html',
})
export class TablePicker {
  readonly date = input.required<Date>();
  readonly time = input<string | null>(null);
  readonly guests = input(2);
  readonly selected = model<string | null>(null);

  private readonly bookingService = inject(BookingService);
  protected readonly loading = signal(false);
  protected readonly tables = signal<RestaurantTable[]>([]);
  protected readonly error = signal('');

  protected readonly availableCount = computed(
    () => this.tables().filter((table) => table.available && table.seats >= this.guests()).length,
  );
  protected readonly guestsText = computed(() => guestsLabel(this.guests()));
  protected readonly selectedTable = computed(
    () => this.tables().find((table) => table.id === this.selected()) ?? null,
  );

  constructor() {
    effect((onCleanup) => {
      const date = this.date();
      const time = this.time();
      this.loading.set(Boolean(time));
      this.error.set('');
      const subscription = this.bookingService.getTables(date, time).subscribe({
        next: (tables) => {
          this.tables.set(tables);
          this.loading.set(false);
          if (!tables.some((table) => table.id === this.selected() && table.available)) {
            this.selected.set(null);
          }
        },
        error: () => {
          this.tables.set([]);
          this.loading.set(false);
          this.error.set('Не удалось загрузить доступность столиков. Попробуйте ещё раз.');
        },
      });
      onCleanup(() => subscription.unsubscribe());
    });
  }

  protected choose(tableId: string): void {
    const table = this.tables().find((item) => item.id === tableId);
    if (table?.available && table.seats >= this.guests()) {
      this.selected.set(tableId);
    }
  }

  protected seatsLabel(seats: number): string {
    const lastTwoDigits = seats % 100;
    const lastDigit = seats % 10;
    const noun =
      lastTwoDigits >= 11 && lastTwoDigits <= 14
        ? 'мест'
        : lastDigit === 1
          ? 'место'
          : lastDigit >= 2 && lastDigit <= 4
            ? 'места'
            : 'мест';
    return `${seats} ${noun}`;
  }

  protected chairPositions(seats: number): string[] {
    switch (seats) {
      case 2:
        return ['left', 'right'];
      case 4:
        return ['top-left', 'top-right', 'bottom-left', 'bottom-right'];
      case 6:
        return [
          'top-left',
          'top-center',
          'top-right',
          'bottom-left',
          'bottom-center',
          'bottom-right',
        ];
      case 8:
        return [
          'top-left',
          'top-center',
          'top-right',
          'bottom-left',
          'bottom-center',
          'bottom-right',
          'left',
          'right',
        ];
      default:
        return [
          'top-outer-left',
          'top-left',
          'top-right',
          'top-outer-right',
          'bottom-outer-left',
          'bottom-left',
          'bottom-right',
          'bottom-outer-right',
          'left',
          'right',
        ];
    }
  }

  protected tableStatus(tableId: string, available: boolean, seats: number): string {
    if (!this.time()) {
      return 'Выберите время';
    }
    if (this.selected() === tableId) {
      return 'Выбран';
    }
    if (!available) {
      return 'Занят';
    }
    return seats < this.guests() ? 'Мало мест' : 'Свободен';
  }
}

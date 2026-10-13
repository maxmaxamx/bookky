import { Component, computed, input, linkedSignal, model } from '@angular/core';
import {
  addDays,
  addMonths,
  formatDateLong,
  formatDateShort,
  isSameDay,
  isUnavailableDay,
  monthMatrix,
  monthTitle,
  startOfDay,
  startOfMonth,
} from '../../../../core/utils/date.util';

const WEEKDAY_HEADERS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
/** На сколько месяцев вперёд открыто бронирование. */
const BOOKING_HORIZON_MONTHS = 3;

@Component({
  selector: 'app-date-picker',
  styleUrl: './date-picker.scss',
  templateUrl: './date-picker.html',
})
export class DatePicker {
  readonly selected = model.required<Date>();
  /** Текущая дата; вынесена в input, чтобы её можно было зафиксировать в тестах. */
  readonly today = input(startOfDay(new Date()));

  protected readonly weekdayHeaders = WEEKDAY_HEADERS;

  /** Открытый месяц следует за выбранной датой. */
  protected readonly viewMonth = linkedSignal(() => startOfMonth(this.selected()));
  protected readonly weeks = computed(() => monthMatrix(this.viewMonth()));
  protected readonly monthLabel = computed(() => monthTitle(this.viewMonth()));

  protected readonly canGoBack = computed(
    () => this.viewMonth().getTime() > startOfMonth(this.today()).getTime(),
  );
  protected readonly canGoForward = computed(
    () =>
      this.viewMonth().getTime() <
      startOfMonth(addMonths(this.today(), BOOKING_HORIZON_MONTHS)).getTime(),
  );

  /** Быстрые варианты: ближайшие три доступных дня. */
  protected readonly quickPicks = computed(() =>
    Array.from({ length: 7 }, (_, offset) => addDays(this.today(), offset))
      .filter((day) => !isUnavailableDay(day, this.today()))
      .slice(0, 3),
  );

  protected select(day: Date | null): void {
    if (this.isUnavailable(day)) {
      return;
    }
    this.selected.set(startOfDay(day as Date));
  }

  protected prevMonth(): void {
    if (this.canGoBack()) {
      this.viewMonth.set(addMonths(this.viewMonth(), -1));
    }
  }

  protected nextMonth(): void {
    if (this.canGoForward()) {
      this.viewMonth.set(addMonths(this.viewMonth(), 1));
    }
  }

  protected isUnavailable(day: Date | null): boolean {
    return !day || isUnavailableDay(day, this.today());
  }

  protected isSelected(day: Date | null): boolean {
    return !!day && isSameDay(day, this.selected());
  }

  protected isToday(day: Date | null): boolean {
    return !!day && isSameDay(day, this.today());
  }

  protected dayClass(day: Date): string {
    if (this.isUnavailable(day)) {
      return 'dp-day dp-day--off';
    }
    if (this.isSelected(day)) {
      return 'dp-day dp-day--on';
    }
    if (this.isToday(day)) {
      return 'dp-day dp-day--today';
    }
    return 'dp-day dp-day--free';
  }

  protected chipClass(day: Date): string {
    return this.isSelected(day) ? 'dp-chip dp-chip--on' : 'dp-chip dp-chip--idle';
  }

  protected selectedLabel(): string {
    return formatDateLong(this.selected());
  }

  protected shortLabel(day: Date): string {
    const days = Math.round((startOfDay(day).getTime() - this.today().getTime()) / 86_400_000);
    if (days === 0) {
      return 'Сегодня';
    }
    if (days === 1) {
      return 'Завтра';
    }
    return formatDateShort(day);
  }

  protected dayAria(day: Date): string {
    const suffix = this.isUnavailable(day) ? ' — ресторан закрыт' : '';
    return `${formatDateLong(day)}${suffix}`;
  }
}

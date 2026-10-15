import { Component, computed, inject, signal, viewChild } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { BookingConfirmation, GuestDetails, PreorderItem } from '../../core/models/booking.model';
import { BookingService, hasBookableSlots } from '../../core/services/booking.service';
import { SITE } from '../../core/site';
import { addDays, startOfDay, toIsoDate } from '../../core/utils/date.util';
import { BookingForm } from './components/booking-form/booking-form';
import { BookingStep } from './components/booking-step/booking-step';
import { BookingSummary } from './components/booking-summary/booking-summary';
import { ConfirmationModal } from './components/confirmation-modal/confirmation-modal';
import { DatePicker } from './components/date-picker/date-picker';
import { DishPicker } from './components/dish-picker/dish-picker';
import { GuestCounter } from './components/guest-counter/guest-counter';
import { TablePicker } from './components/table-picker/table-picker';
import { TimeSlots } from './components/time-slots/time-slots';

/** Ближайший день, на который ещё можно забронировать стол. */
function pickFirstAvailableDate(today: Date = new Date()): Date {
  let candidate = startOfDay(today);
  for (let offset = 0; offset < 14; offset++) {
    if (hasBookableSlots(candidate, today)) {
      return candidate;
    }
    candidate = addDays(candidate, 1);
  }
  return startOfDay(today);
}

@Component({
  imports: [
    BookingForm,
    BookingStep,
    BookingSummary,
    ConfirmationModal,
    DatePicker,
    DishPicker,
    GuestCounter,
    TablePicker,
    TimeSlots,
  ],
  selector: 'app-booking',
  styleUrl: './booking.scss',
  templateUrl: './booking.html',
})
export class Booking {
  protected readonly site = SITE;

  private readonly bookingService = inject(BookingService);
  /** Ссылка на форму, чтобы очистить её после успешной брони. */
  private readonly form = viewChild.required(BookingForm);

  protected readonly date = signal(pickFirstAvailableDate());
  protected readonly time = signal<string | null>(null);
  protected readonly guests = signal(2);
  protected readonly tableId = signal<string | null>(null);
  protected readonly preorder = signal<PreorderItem[]>([]);

  protected readonly tableLabel = computed(() => {
    const id = this.tableId();
    const table = this.bookingService.getTableDetails(id);
    return table ? `Стол ${table.id}, ${table.zone.toLowerCase()}` : null;
  });

  protected readonly submitting = signal(false);
  protected readonly apiError = signal<string | null>(null);
  protected readonly confirmation = signal<BookingConfirmation | null>(null);
  protected readonly modalOpen = signal(false);

  protected readonly facts = [
    'Онлайн-бронь до 12 гостей',
    'Столик держим 15 минут',
    'Депозит не требуется',
    SITE.closedNote,
  ];

  protected onTimeSelected(time: string | null): void {
    this.apiError.set(null);
    if (this.time() !== time) {
      this.tableId.set(null);
    }
    this.time.set(time);
  }

  protected onGuestsChange(guests: number): void {
    this.apiError.set(null);
    this.guests.set(guests);
    const selected = this.bookingService.getTableDetails(this.tableId());
    if (selected && selected.seats < guests) {
      this.tableId.set(null);
    }
  }

  protected onDateSelected(date: Date): void {
    this.apiError.set(null);
    this.date.set(date);
    this.time.set(null);
    this.tableId.set(null);
  }

  protected onSubmit(details: GuestDetails): void {
    const time = this.time();
    const tableId = this.tableId();
    if (!time || !tableId || this.submitting()) {
      return;
    }

    this.apiError.set(null);
    this.submitting.set(true);
    this.bookingService
      .createBooking({
        date: toIsoDate(this.date()),
        time,
        guests: this.guests(),
        tableId,
        name: details.name,
        phone: details.phone,
        comment: details.comment || undefined,
        preorder: this.preorder().length > 0 ? this.preorder() : undefined,
      })
      .subscribe({
        next: (confirmation) => {
          this.confirmation.set(confirmation);
          this.submitting.set(false);
          this.modalOpen.set(true);
        },
        error: (error: unknown) => {
          this.submitting.set(false);
          if (error instanceof HttpErrorResponse && error.status === 409) {
            this.apiError.set('Этот столик уже занят на выбранное время. Выберите другой столик или время.');
            return;
          }
          const message =
            error instanceof HttpErrorResponse && typeof error.error?.message === 'string'
              ? error.error.message
              : 'Не удалось отправить бронирование. Проверьте соединение и попробуйте ещё раз.';
          this.apiError.set(message);
        },
      });
  }

  /** После закрытия модалки очищаем форму и выбранное время. */
  protected onModalClosed(): void {
    this.confirmation.set(null);
    this.apiError.set(null);
    this.time.set(null);
    this.tableId.set(null);
    this.preorder.set([]);
    this.form().reset();
  }
}

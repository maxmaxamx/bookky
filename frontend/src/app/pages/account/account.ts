import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BookingConfirmation, BookingStatus } from '../../core/models/booking.model';
import { BookingService } from '../../core/services/booking.service';
import { AuthService } from '../../core/services/auth.service';
import { formatDateLong, fromIsoDate, guestsLabel } from '../../core/utils/date.util';

@Component({
  imports: [RouterLink],
  selector: 'app-account',
  styleUrl: './account.scss',
  templateUrl: './account.html',
})
export class Account {
  private readonly bookingService = inject(BookingService);
  protected readonly auth = inject(AuthService);
  protected readonly bookings = signal<BookingConfirmation[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal('');
  protected readonly cancellingIds = signal<ReadonlySet<string>>(new Set());

  constructor() {
    this.loadBookings();
  }

  protected loadBookings(): void {
    this.loading.set(true);
    this.error.set('');
    this.bookingService.getMyBookings().subscribe({
      next: (bookings) => {
        this.bookings.set(bookings);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Не удалось загрузить ваши бронирования. Попробуйте обновить список.');
        this.loading.set(false);
      },
    });
  }

  protected cancel(booking: BookingConfirmation): void {
    this.setCancelling(booking.id, true);
    this.bookingService.cancelMyBooking(booking.id).subscribe({
      next: (updated) => {
        this.bookings.update((records) =>
          records.map((record) => (record.id === updated.id ? updated : record)),
        );
        this.setCancelling(booking.id, false);
      },
      error: () => {
        this.error.set('Не удалось отменить бронь. Обновите список и попробуйте ещё раз.');
        this.setCancelling(booking.id, false);
      },
    });
  }

  protected dateLabel(date: string): string {
    return formatDateLong(fromIsoDate(date));
  }

  protected guestsLabel(guests: number): string {
    return guestsLabel(guests);
  }

  protected statusLabel(status: BookingStatus): string {
    return {
      Pending: 'Ожидает подтверждения',
      Confirmed: 'Подтверждена',
      Cancelled: 'Отменена',
    }[status];
  }

  private setCancelling(id: string, cancelling: boolean): void {
    this.cancellingIds.update((ids) => {
      const next = new Set(ids);
      if (cancelling) next.add(id);
      else next.delete(id);
      return next;
    });
  }
}

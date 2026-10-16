import { Component, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { BookingConfirmation, BookingStatus, PreorderItem } from '../../core/models/booking.model';
import { BookingService } from '../../core/services/booking.service';
import { AuthService } from '../../core/services/auth.service';
import { formatDateLong, fromIsoDate, guestsLabel, toIsoDate } from '../../core/utils/date.util';

type AccountTab = 'upcoming' | 'all' | 'cancelled';

@Component({
  imports: [RouterLink, DatePipe],
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
  protected readonly activeTab = signal<AccountTab>('all');

  protected readonly todayIso = toIsoDate(new Date());

  /** Актуальные бронирования без просроченных прошедших дней. */
  protected readonly validBookings = computed(() =>
    this.bookings().filter((b) => b.date >= this.todayIso),
  );

  protected readonly upcomingBookings = computed(() =>
    this.validBookings().filter((b) => b.status !== 'Cancelled'),
  );

  protected readonly cancelledBookings = computed(() =>
    this.validBookings().filter((b) => b.status === 'Cancelled'),
  );

  protected readonly displayedBookings = computed(() => {
    switch (this.activeTab()) {
      case 'upcoming':
        return this.upcomingBookings();
      case 'cancelled':
        return this.cancelledBookings();
      case 'all':
      default:
        return this.validBookings();
    }
  });

  protected readonly stats = computed(() => {
    const all = this.validBookings();
    const upcoming = this.upcomingBookings();
    const totalPreorderItems = upcoming.reduce((acc, b) => {
      const items = b.preorder ?? [];
      return acc + items.reduce((sum, item) => sum + item.quantity, 0);
    }, 0);

    return {
      total: all.length,
      upcoming: upcoming.length,
      preordersCount: totalPreorderItems,
    };
  });

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

  protected preorderTotal(preorder?: PreorderItem[]): number {
    if (!preorder || preorder.length === 0) return 0;
    return preorder.reduce((acc, item) => acc + item.price * item.quantity, 0);
  }

  protected formatRub(value: number): string {
    return `${new Intl.NumberFormat('ru-RU').format(value)} ₽`;
  }

  protected userInitials(email?: string): string {
    if (!email) return 'Г';
    return email.charAt(0).toUpperCase();
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

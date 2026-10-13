import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, signal } from '@angular/core';
import { BookingConfirmation, BookingStatus } from '../../core/models/booking.model';
import { BookingService } from '../../core/services/booking.service';
import { formatDateLong, fromIsoDate, guestsLabel } from '../../core/utils/date.util';

type StatusFilter = 'all' | BookingStatus;

@Component({
  selector: 'app-admin',
  styleUrl: './admin.scss',
  templateUrl: './admin.html',
})
export class Admin {
  private readonly bookingService = inject(BookingService);

  protected readonly bookings = signal<BookingConfirmation[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal('');
  protected readonly statusFilter = signal<StatusFilter>('all');
  protected readonly dateFilter = signal('');
  protected readonly savingIds = signal<ReadonlySet<string>>(new Set());

  protected readonly filteredBookings = computed(() =>
    this.bookings().filter((booking) => {
      const matchesStatus =
        this.statusFilter() === 'all' || booking.status === this.statusFilter();
      const matchesDate = !this.dateFilter() || booking.date === this.dateFilter();
      return matchesStatus && matchesDate;
    }),
  );

  protected readonly counts = computed(() => {
    const records = this.bookings();
    return {
      total: records.length,
      pending: records.filter((booking) => booking.status === 'Pending').length,
      confirmed: records.filter((booking) => booking.status === 'Confirmed').length,
    };
  });

  constructor() {
    this.loadBookings();
  }

  protected loadBookings(): void {
    this.loading.set(true);
    this.error.set('');
    this.bookingService.getBookings().subscribe({
      next: (bookings) => {
        this.bookings.set(bookings);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Не удалось загрузить бронирования. Проверьте соединение и обновите список.');
        this.loading.set(false);
      },
    });
  }

  protected setStatusFilter(event: Event): void {
    this.statusFilter.set((event.target as HTMLSelectElement).value as StatusFilter);
  }

  protected setDateFilter(event: Event): void {
    this.dateFilter.set((event.target as HTMLInputElement).value);
  }

  protected clearFilters(): void {
    this.statusFilter.set('all');
    this.dateFilter.set('');
  }

  protected updateStatus(booking: BookingConfirmation, event: Event): void {
    const status = (event.target as HTMLSelectElement).value as BookingStatus;
    if (status === booking.status) {
      return;
    }

    this.setSaving(booking.id, true);
    this.error.set('');
    this.bookingService.updateBookingStatus(booking.id, status).subscribe({
      next: (updated) => {
        this.bookings.update((records) =>
          records.map((record) => (record.id === updated.id ? updated : record)),
        );
        this.setSaving(booking.id, false);
      },
      error: (error: unknown) => {
        this.error.set(
          error instanceof HttpErrorResponse && error.status === 409
            ? 'Нельзя активировать бронь: выбранный стол уже занят на это время.'
            : 'Не удалось изменить статус. Попробуйте ещё раз.',
        );
        this.setSaving(booking.id, false);
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
      Pending: 'Ожидает',
      Confirmed: 'Подтверждена',
      Cancelled: 'Отменена',
    }[status];
  }

  private setSaving(id: string, saving: boolean): void {
    this.savingIds.update((ids) => {
      const next = new Set(ids);
      if (saving) {
        next.add(id);
      } else {
        next.delete(id);
      }
      return next;
    });
  }
}

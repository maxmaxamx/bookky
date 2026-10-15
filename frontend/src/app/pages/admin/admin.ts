import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, effect, inject, signal } from '@angular/core';
import {
  AdminTableDetail,
  BookingConfirmation,
  BookingStatus,
  PreorderItem,
} from '../../core/models/booking.model';
import { AuthService } from '../../core/services/auth.service';
import { BookingService } from '../../core/services/booking.service';
import { formatDateLong, fromIsoDate, guestsLabel, toIsoDate } from '../../core/utils/date.util';

type StatusFilter = 'all' | BookingStatus;
type AdminViewMode = 'table' | 'hall';

const SLOT_TIMES = [
  '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30',
  '16:00', '16:30', '17:00', '17:30', '18:00', '18:30', '19:00', '19:30',
  '20:00', '20:30', '21:00', '21:30', '22:00', '22:30',
];

@Component({
  selector: 'app-admin',
  styleUrl: './admin.scss',
  templateUrl: './admin.html',
})
export class Admin {
  private readonly bookingService = inject(BookingService);
  protected readonly auth = inject(AuthService, { optional: true });

  protected readonly viewMode = signal<AdminViewMode>('table');
  protected readonly bookings = signal<BookingConfirmation[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal('');
  protected readonly statusFilter = signal<StatusFilter>('all');
  protected readonly dateFilter = signal('');
  protected readonly savingIds = signal<ReadonlySet<string>>(new Set());

  // Интерактивная схема зала
  protected readonly slotTimes = SLOT_TIMES;
  protected readonly hallDate = signal(toIsoDate(new Date()));
  protected readonly hallTime = signal('18:00');
  protected readonly hallTables = signal<AdminTableDetail[]>([]);
  protected readonly hallLoading = signal(false);
  protected readonly selectedTable = signal<AdminTableDetail | null>(null);

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
    const preordersCount = records.reduce((acc, b) => {
      const items = b.preorder ?? [];
      return acc + items.reduce((sum, item) => sum + item.quantity, 0);
    }, 0);

    return {
      total: records.length,
      pending: records.filter((booking) => booking.status === 'Pending').length,
      confirmed: records.filter((booking) => booking.status === 'Confirmed').length,
      preorders: preordersCount,
    };
  });

  protected readonly hallOccupiedCount = computed(
    () => this.hallTables().filter((t) => !t.available).length,
  );

  constructor() {
    this.loadBookings();

    // Загрузка занятости зала при изменении даты или времени
    effect(() => {
      const date = this.hallDate();
      const time = this.hallTime();
      this.loadHallStatus(date, time);
    });
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

  protected loadHallStatus(date: string, time: string): void {
    if (typeof this.bookingService.getAdminHallStatus !== 'function') {
      return;
    }

    this.hallLoading.set(true);
    this.bookingService.getAdminHallStatus(date, time).subscribe({
      next: (tables) => {
        this.hallTables.set(tables);
        this.hallLoading.set(false);
        // Если выбран столик, обновим его данные
        const currentSelected = this.selectedTable();
        if (currentSelected) {
          const updated = tables.find((t) => t.id === currentSelected.id);
          this.selectedTable.set(updated ?? null);
        }
      },
      error: () => {
        this.hallLoading.set(false);
      },
    });
  }

  protected selectHallTable(table: AdminTableDetail): void {
    this.selectedTable.set(table);
  }

  protected setHallDate(event: Event): void {
    const val = (event.target as HTMLInputElement).value;
    if (val) this.hallDate.set(val);
  }

  protected setHallTime(time: string): void {
    this.hallTime.set(time);
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
        // Обновить схему зала
        this.loadHallStatus(this.hallDate(), this.hallTime());
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

  protected preorderTotal(preorder?: PreorderItem[]): number {
    if (!preorder || preorder.length === 0) return 0;
    return preorder.reduce((acc, item) => acc + item.price * item.quantity, 0);
  }

  protected formatRub(value: number): string {
    return `${new Intl.NumberFormat('ru-RU').format(value)} ₽`;
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

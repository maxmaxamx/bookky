import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, of } from 'rxjs';
import {
  AdminTableDetail,
  BookingConfirmation,
  BookingRequest,
  BookingStatus,
  MenuItem,
  RestaurantTable,
  SlotPeriod,
  TimeSlot,
} from '../models/booking.model';
import { isClosedDay, isSameDay, toIsoDate } from '../utils/date.util';

/** Время работы кухни и зала, шаг бронирования — 30 минут. */
const SLOT_TIMES = [
  '12:00',
  '12:30',
  '13:00',
  '13:30',
  '14:00',
  '14:30',
  '15:00',
  '15:30',
  '16:00',
  '16:30',
  '17:00',
  '17:30',
  '18:00',
  '18:30',
  '19:00',
  '19:30',
  '20:00',
  '20:30',
  '21:00',
  '21:30',
  '22:00',
  '22:30',
];

const EVENING_START_MINUTES = 17 * 60;
/** Минимальное время до начала брони (в минутах). */
const MIN_LEAD_MINUTES = 60;
const RESTAURANT_TABLES: Omit<RestaurantTable, 'available'>[] = [
  { id: 'T01', seats: 2, zone: 'У окна', position: 't01' },
  { id: 'T02', seats: 2, zone: 'У окна', position: 't02' },
  { id: 'T03', seats: 2, zone: 'У окна', position: 't03' },
  { id: 'T04', seats: 4, zone: 'Основной зал', position: 't04' },
  { id: 'T05', seats: 4, zone: 'Основной зал', position: 't05' },
  { id: 'T06', seats: 4, zone: 'Основной зал', position: 't06' },
  { id: 'T07', seats: 4, zone: 'Основной зал', position: 't07' },
  { id: 'T08', seats: 6, zone: 'Основной зал', position: 't08' },
  { id: 'T09', seats: 6, zone: 'Основной зал', position: 't09' },
  { id: 'T10', seats: 8, zone: 'У камина', position: 't10' },
  { id: 'T11', seats: 8, zone: 'У камина', position: 't11' },
  { id: 'T12', seats: 10, zone: 'Отдельный зал', position: 't12' },
];

function toMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

const LAST_SLOT_MINUTES = toMinutes(SLOT_TIMES[SLOT_TIMES.length - 1]);

/**
 * Можно ли ещё забронировать стол на этот день.
 * Учитывает выходной и минимальное время до начала брони для текущего дня.
 */
export function hasBookableSlots(date: Date, now: Date = new Date()): boolean {
  if (isClosedDay(date)) {
    return false;
  }
  if (isSameDay(date, now)) {
    return now.getHours() * 60 + now.getMinutes() + MIN_LEAD_MINUTES <= LAST_SLOT_MINUTES;
  }
  return date.getTime() >= now.getTime();
}

@Injectable({ providedIn: 'root' })
export class BookingService {
  private readonly http = inject(HttpClient);

  getSlots(date: Date): Observable<TimeSlot[]> {
    return this.http.get<TimeSlot[]>('/api/bookings/slots', {
      params: { date: toIsoDate(date) },
    });
  }

  getTables(date: Date, time: string | null): Observable<RestaurantTable[]> {
    if (!time || isClosedDay(date)) {
      return of(RESTAURANT_TABLES.map((table) => ({ ...table, available: false })));
    }

    return this.http.get<RestaurantTable[]>('/api/tables/availability', {
      params: { date: toIsoDate(date), time },
    });
  }

  getTableDetails(tableId: string | null): Omit<RestaurantTable, 'available'> | undefined {
    return RESTAURANT_TABLES.find((table) => table.id === tableId);
  }

  createBooking(request: BookingRequest): Observable<BookingConfirmation> {
    return this.http.post<BookingConfirmation>('/api/bookings', request);
  }

  getBookings(): Observable<BookingConfirmation[]> {
    return this.http.get<BookingConfirmation[]>('/api/bookings');
  }

  getMyBookings(): Observable<BookingConfirmation[]> {
    return this.http.get<BookingConfirmation[]>('/api/bookings/mine');
  }

  cancelMyBooking(id: string): Observable<BookingConfirmation> {
    return this.http.patch<BookingConfirmation>(
      `/api/bookings/${encodeURIComponent(id)}/cancel`,
      {},
    );
  }

  updateBookingStatus(id: string, status: BookingStatus): Observable<BookingConfirmation> {
    return this.http.patch<BookingConfirmation>(
      `/api/bookings/${encodeURIComponent(id)}/status`,
      { status },
    );
  }

  getMenu(): Observable<MenuItem[]> {
    return this.http.get<MenuItem[]>('/api/menu');
  }

  getAdminHallStatus(date: string, time: string): Observable<AdminTableDetail[]> {
    return this.http.get<AdminTableDetail[]>('/api/admin/hall-status', {
      params: { date, time },
    });
  }
}


import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import {
  BookingConfirmation,
  BookingStatus,
  RestaurantTable,
  TimeSlot,
} from '../models/booking.model';
import { BookingService, hasBookableSlots } from './booking.service';

/** Вторник, 6 октября 2026 — рабочий день. */
const TUESDAY = new Date(2026, 9, 6);
/** Понедельник, 5 октября 2026 — выходной. */
const MONDAY = new Date(2026, 9, 5);
/** Пятница, 2 октября 2026. */
const FRIDAY = new Date(2026, 9, 2);

describe('BookingService', () => {
  let service: BookingService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(BookingService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpTesting.verify());

  it('возвращает слоты на рабочий день', async () => {
    const result = firstValueFrom(service.getSlots(TUESDAY));
    const request = httpTesting.expectOne('/api/bookings/slots?date=2026-10-06');
    expect(request.request.method).toBe('GET');
    request.flush([
      { id: '2026-10-06-13:00', time: '13:00', period: 'day', available: true, tablesLeft: 3 },
    ] satisfies TimeSlot[]);
    const slots = await result;

    expect(slots).toHaveLength(1);
    expect(slots[0].available).toBe(true);
  });

  it('получает пустой список слотов на выходной день от API', async () => {
    const result = firstValueFrom(service.getSlots(MONDAY));
    httpTesting.expectOne('/api/bookings/slots?date=2026-10-05').flush([]);
    expect(await result).toEqual([]);
  });

  it('создаёт бронь через API и принимает подтверждение сервера', async () => {
    const booking = {
      date: '2026-10-06', time: '19:00', guests: 4, tableId: 'T04',
      name: 'Анна', phone: '+7 (999) 123-45-67',
    };
    const result = firstValueFrom(service.createBooking(booking));
    const request = httpTesting.expectOne('/api/bookings');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual(booking);
    request.flush({
      ...booking,
      id: 'BK-AB12CD34',
      status: 'Pending',
      table: 'Стол T04, основной зал',
      createdAt: '2026-10-06T12:00:00.000Z',
    } satisfies BookingConfirmation);
    const confirmation = await result;

    expect(confirmation.id).toMatch(/^BK-[A-Z0-9]{8}$/);
    expect(confirmation.status).toBe('Pending');
    expect(confirmation.table).toBeTruthy();
    expect(confirmation.guests).toBe(4);
    expect(confirmation.table).toContain('T04');
    expect(confirmation.time).toBe('19:00');
  });

  it('запрашивает схему столов и доступность выбранного слота', async () => {
    const result = firstValueFrom(service.getTables(TUESDAY, '19:00'));
    const request = httpTesting.expectOne(
      (request) =>
        request.url === '/api/tables/availability' &&
        request.params.get('date') === '2026-10-06' &&
        request.params.get('time') === '19:00',
    );
    expect(request.request.method).toBe('GET');
    request.flush(
      Array.from({ length: 12 }, (_, index) => ({
        id: `T${`${index + 1}`.padStart(2, '0')}`,
        seats: index < 3 ? 2 : 4,
        zone: 'Основной зал',
        position: `t${`${index + 1}`.padStart(2, '0')}`,
        available: true,
      })) satisfies RestaurantTable[],
    );
    const tables = await result;

    expect(tables.find((table) => table.id === 'T01')?.seats).toBe(2);
    expect(tables.find((table) => table.id === 'T01')?.available).toBe(true);
    expect(tables).toHaveLength(12);
  });

  it('подсказывает, можно ли ещё забронировать день', () => {
    // понедельник закрыт
    expect(hasBookableSlots(MONDAY, new Date(2026, 9, 5, 12, 0))).toBe(false);
    // будущий рабочий день доступен
    expect(hasBookableSlots(TUESDAY, new Date(2026, 9, 2, 12, 0))).toBe(true);
    // на сегодня в 23:00 бронь уже недоступна — слоты заканчиваются в 22:30
    expect(hasBookableSlots(FRIDAY, new Date(2026, 9, 2, 23, 0))).toBe(false);
    // прошедший день недоступен
    expect(hasBookableSlots(new Date(2026, 8, 30), new Date(2026, 9, 2, 12, 0))).toBe(false);
  });

  it('не запрашивает столы до выбора времени', async () => {
    expect(await firstValueFrom(service.getTables(TUESDAY, null))).toHaveLength(12);
    httpTesting.expectNone('/api/tables/availability');
  });

  it('загружает бронирования для панели администратора', async () => {
    const result = firstValueFrom(service.getBookings());
    const request = httpTesting.expectOne('/api/bookings');
    expect(request.request.method).toBe('GET');
    request.flush([]);
    expect(await result).toEqual([]);
  });

  it('загружает только личные бронирования пользователя', async () => {
    const result = firstValueFrom(service.getMyBookings());
    const request = httpTesting.expectOne('/api/bookings/mine');
    expect(request.request.method).toBe('GET');
    request.flush([]);
    expect(await result).toEqual([]);
  });

  it('отменяет своё бронирование через API', async () => {
    const result = firstValueFrom(service.cancelMyBooking('BK-AB12CD34'));
    const request = httpTesting.expectOne('/api/bookings/BK-AB12CD34/cancel');
    expect(request.request.method).toBe('PATCH');
    request.flush({
      id: 'BK-AB12CD34',
      date: '2026-10-06',
      time: '19:00',
      guests: 4,
      tableId: 'T04',
      name: 'Анна',
      phone: '+7 (999) 123-45-67',
      table: 'Стол T04, основной зал',
      status: 'Cancelled',
      createdAt: '2026-10-06T12:00:00.000Z',
    } satisfies BookingConfirmation);
    expect((await result).status).toBe('Cancelled');
  });

  it('обновляет статус бронирования через PATCH', async () => {
    const result = firstValueFrom(service.updateBookingStatus('BK-AB12CD34', 'Confirmed'));
    const request = httpTesting.expectOne('/api/bookings/BK-AB12CD34/status');
    expect(request.request.method).toBe('PATCH');
    expect(request.request.body).toEqual({ status: 'Confirmed' satisfies BookingStatus });
    request.flush({
      id: 'BK-AB12CD34',
      date: '2026-10-06',
      time: '19:00',
      guests: 4,
      tableId: 'T04',
      name: 'Анна',
      phone: '+7 (999) 123-45-67',
      table: 'Стол T04, основной зал',
      status: 'Confirmed',
      createdAt: '2026-10-06T12:00:00.000Z',
    } satisfies BookingConfirmation);
    expect((await result).status).toBe('Confirmed');
  });
});

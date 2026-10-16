import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { BookingService } from '../../core/services/booking.service';
import { BookingConfirmation } from '../../core/models/booking.model';
import { Account } from './account';

import { toIsoDate } from '../../core/utils/date.util';

const TODAY_ISO = toIsoDate(new Date());

const BOOKING: BookingConfirmation = {
  id: 'BK-00112233',
  date: TODAY_ISO,
  time: '18:30',
  guests: 2,
  tableId: 'T01',
  name: 'Guest',
  phone: '+7 (999) 123-45-67',
  table: 'Стол T01, у окна',
  status: 'Pending',
  createdAt: '2026-10-13T12:00:00.000Z',
};

const EXPIRED_BOOKING: BookingConfirmation = {
  id: 'BK-EXPIRED',
  date: '2020-01-01',
  time: '12:00',
  guests: 2,
  tableId: 'T02',
  name: 'Old Guest',
  phone: '+7 (999) 123-45-67',
  table: 'Стол T02, у окна',
  status: 'Pending',
  createdAt: '2020-01-01T12:00:00.000Z',
};

describe('Account', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Account],
      providers: [
        provideRouter([]),
        {
          provide: AuthService,
          useValue: { user: signal({ id: 'user-1', email: 'guest@example.com', role: 'user' }) },
        },
        {
          provide: BookingService,
          useValue: {
            getMyBookings: () => of([BOOKING, EXPIRED_BOOKING]),
            cancelMyBooking: () => of({ ...BOOKING, status: 'Cancelled' }),
          },
        },
      ],
    }).compileComponents();
  });

  it('shows and cancels one of the current user bookings, hiding expired ones', async () => {
    const fixture: ComponentFixture<Account> = TestBed.createComponent(Account);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    expect(root.textContent).toContain('BK-00112233');
    expect(root.textContent).not.toContain('BK-EXPIRED');

    root.querySelector<HTMLButtonElement>('.account__cancel')!.click();
    fixture.detectChanges();
    expect(root.textContent).toContain('Отменена');
    expect(root.querySelector('.account__cancel')).toBeNull();
  });
});

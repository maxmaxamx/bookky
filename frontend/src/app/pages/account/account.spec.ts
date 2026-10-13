import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { BookingService } from '../../core/services/booking.service';
import { BookingConfirmation } from '../../core/models/booking.model';
import { Account } from './account';

const BOOKING: BookingConfirmation = {
  id: 'BK-00112233',
  date: '2026-10-14',
  time: '18:30',
  guests: 2,
  tableId: 'T01',
  name: 'Guest',
  phone: '+7 (999) 123-45-67',
  table: 'Стол T01, у окна',
  status: 'Pending',
  createdAt: '2026-10-13T12:00:00.000Z',
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
            getMyBookings: () => of([BOOKING]),
            cancelMyBooking: () => of({ ...BOOKING, status: 'Cancelled' }),
          },
        },
      ],
    }).compileComponents();
  });

  it('shows and cancels one of the current user bookings', async () => {
    const fixture: ComponentFixture<Account> = TestBed.createComponent(Account);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    expect(root.textContent).toContain('BK-00112233');

    root.querySelector<HTMLButtonElement>('.account__cancel')!.click();
    fixture.detectChanges();
    expect(root.textContent).toContain('Отменена');
    expect(root.querySelector('.account__cancel')).toBeNull();
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { BookingConfirmation, BookingStatus } from '../../core/models/booking.model';
import { BookingService } from '../../core/services/booking.service';
import { Admin } from './admin';

const BOOKINGS: BookingConfirmation[] = [
  {
    id: 'BK-1001',
    date: '2026-10-14',
    time: '18:00',
    guests: 2,
    tableId: 'T01',
    name: 'Мария',
    phone: '+7 (999) 123-45-67',
    table: 'Стол T01, у окна',
    status: 'Pending',
    createdAt: '2026-10-13T12:00:00.000Z',
  },
  {
    id: 'BK-1002',
    date: '2026-10-15',
    time: '19:00',
    guests: 4,
    tableId: 'T04',
    name: 'Анна',
    phone: '+7 (999) 123-45-68',
    table: 'Стол T04, основной зал',
    status: 'Confirmed',
    createdAt: '2026-10-13T13:00:00.000Z',
  },
];

const bookingServiceStub = {
  getBookings: () => of(BOOKINGS),
  updateBookingStatus: (id: string, status: BookingStatus) =>
    of({ ...BOOKINGS.find((booking) => booking.id === id)!, status }),
};

describe('Admin', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Admin],
      providers: [{ provide: BookingService, useValue: bookingServiceStub }],
    }).compileComponents();
  });

  async function render(): Promise<ComponentFixture<Admin>> {
    const fixture = TestBed.createComponent(Admin);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    return fixture;
  }

  it('показывает бронирования и фильтрует список по статусу', async () => {
    const fixture = await render();
    const root = fixture.nativeElement as HTMLElement;
    expect(root.querySelectorAll('tbody tr')).toHaveLength(2);

    const statusFilter = root.querySelector<HTMLSelectElement>('.admin__controls select')!;
    statusFilter.value = 'Confirmed';
    statusFilter.dispatchEvent(new Event('change'));
    fixture.detectChanges();

    expect(root.querySelectorAll('tbody tr')).toHaveLength(1);
    expect(root.querySelector('tbody')?.textContent).toContain('BK-1002');
  });

  it('filters by visit date', async () => {
    const fixture = await render();
    const root = fixture.nativeElement as HTMLElement;
    const dateFilter = root.querySelector<HTMLInputElement>('input[type="date"]')!;
    dateFilter.value = '2026-10-14';
    dateFilter.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    expect(root.querySelectorAll('tbody tr')).toHaveLength(1);
    expect(root.querySelector('tbody')?.textContent).toContain('BK-1001');
  });

  it('updates a reservation status inline', async () => {
    const fixture = await render();
    const root = fixture.nativeElement as HTMLElement;
    const pendingSelect = Array.from(root.querySelectorAll<HTMLSelectElement>('.admin__status'))
      .find((select) => select.value === 'Pending')!;
    pendingSelect.value = 'Confirmed';
    pendingSelect.dispatchEvent(new Event('change'));
    fixture.detectChanges();

    expect(pendingSelect.value).toBe('Confirmed');
  });
});

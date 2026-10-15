import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Home } from './home';

import { of } from 'rxjs';
import { BookingService } from '../../core/services/booking.service';

const mockBookingService = {
  getMenu: () =>
    of([
      {
        id: 'dish-1',
        name: 'Тартар из тунца',
        description: 'Сицилийские томаты, дижонский крем',
        price: 1190,
        category: 'starters',
      },
    ]),
};

describe('Home', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Home],
      providers: [
        provideRouter([]),
        { provide: BookingService, useValue: mockBookingService },
      ],
    }).compileComponents();
  });

  it('рендерит якорные секции для навигации и меню', async () => {
    const fixture = TestBed.createComponent(Home);
    fixture.detectChanges();
    await fixture.whenStable();

    const root = fixture.nativeElement as HTMLElement;

    expect(root.querySelector('#about')).not.toBeNull();
    expect(root.querySelector('#menu')).not.toBeNull();
    expect(root.querySelector('#contacts')).not.toBeNull();
    expect(root.textContent).toContain('Тартар из тунца');
    expect(root.textContent).toContain('Забронировать столик');
  });
});

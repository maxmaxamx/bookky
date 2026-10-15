import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { MenuItem } from '../../core/models/booking.model';
import { BookingService } from '../../core/services/booking.service';
import { MenuPage } from './menu-page';

const MOCK_MENU: MenuItem[] = [
  {
    id: 'dish-1',
    name: 'Тартар из тунца',
    description: 'Сицилийские томаты, дижонский крем',
    price: 1190,
    category: 'starters',
    tag: 'Хит',
    weightGrams: 180,
    image: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c',
  },
  {
    id: 'dish-5',
    name: 'Каре ягнёнка',
    description: 'Нежное каре на гриле, тыква',
    price: 2100,
    category: 'mains',
    weightGrams: 320,
  },
  {
    id: 'dish-10',
    name: 'Шоколадный фондан',
    description: 'Тёплый шоколадный кекс',
    price: 640,
    category: 'desserts',
    weightGrams: 160,
  },
];

const mockBookingService = {
  getMenu: () => of(MOCK_MENU),
};

describe('MenuPage', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MenuPage],
      providers: [
        provideRouter([]),
        { provide: BookingService, useValue: mockBookingService },
      ],
    }).compileComponents();
  });

  it('рендерит блюда из карты меню', async () => {
    const fixture = TestBed.createComponent(MenuPage);
    fixture.detectChanges();
    await fixture.whenStable();

    const root = fixture.nativeElement as HTMLElement;
    expect(root.textContent).toContain('Тартар из тунца');
    expect(root.textContent).toContain('Каре ягнёнка');
    expect(root.textContent).toContain('Шоколадный фондан');
  });

  it('фильтрует блюда по выбранной категории', async () => {
    const fixture = TestBed.createComponent(MenuPage);
    fixture.detectChanges();
    await fixture.whenStable();

    const component = fixture.componentInstance;
    (component as unknown as { activeCategory: { set: (c: string) => void } }).activeCategory.set('starters');
    fixture.detectChanges();

    const root = fixture.nativeElement as HTMLElement;
    expect(root.textContent).toContain('Тартар из тунца');
    expect(root.textContent).not.toContain('Каре ягнёнка');
  });

  it('содержит кнопку перехода к бронированию с предзаказом', async () => {
    const fixture = TestBed.createComponent(MenuPage);
    fixture.detectChanges();
    await fixture.whenStable();

    const root = fixture.nativeElement as HTMLElement;
    const cta = root.querySelector('a[routerLink="/booking"]');
    expect(cta).not.toBeNull();
    expect(cta?.textContent).toContain('Забронировать с предзаказом');
  });
});

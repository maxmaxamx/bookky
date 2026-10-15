import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { MenuItem } from '../../../../core/models/booking.model';
import { BookingService } from '../../../../core/services/booking.service';
import { DishPicker } from './dish-picker';

const MOCK_MENU: MenuItem[] = [
  {
    id: 'dish-1',
    name: 'Тартар из тунца',
    description: 'Сицилийские томаты, дижонский крем',
    price: 1190,
    category: 'starters',
    weightGrams: 180,
    image: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c',
  },
  {
    id: 'dish-5',
    name: 'Каре ягнёнка',
    description: 'Нежное каре на гриле',
    price: 2100,
    category: 'mains',
    weightGrams: 320,
  },
];

const mockBookingService = {
  getMenu: () => of(MOCK_MENU),
};

describe('DishPicker', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DishPicker],
      providers: [{ provide: BookingService, useValue: mockBookingService }],
    }).compileComponents();
  });

  it('рендерит блюда из меню с ценами', async () => {
    const fixture = TestBed.createComponent(DishPicker);
    fixture.detectChanges();
    await fixture.whenStable();

    const root = fixture.nativeElement as HTMLElement;
    expect(root.textContent).toContain('Тартар из тунца');
    expect(root.textContent?.replace(/\u00a0/g, ' ')).toContain('1 190 ₽');
  });

  it('добавляет блюдо в предзаказ при нажатии "+ Добавить"', async () => {
    const fixture = TestBed.createComponent(DishPicker);
    fixture.detectChanges();
    await fixture.whenStable();

    const root = fixture.nativeElement as HTMLElement;
    const addBtn = root.querySelector<HTMLButtonElement>('.dp__add-btn');
    expect(addBtn).not.toBeNull();
    addBtn?.click();
    fixture.detectChanges();

    expect(fixture.componentInstance.items().length).toBe(1);
    expect(fixture.componentInstance.items()[0].name).toBe('Тартар из тунца');
  });

  it('увеличивает и уменьшает количество выбранного блюда', async () => {
    const fixture = TestBed.createComponent(DishPicker);
    fixture.detectChanges();
    await fixture.whenStable();

    const root = fixture.nativeElement as HTMLElement;
    const addBtn = root.querySelector<HTMLButtonElement>('.dp__add-btn');
    addBtn?.click();
    fixture.detectChanges();

    // Находим кнопки + и -
    const plusBtn = root.querySelector<HTMLButtonElement>('.dp__counter-btn:last-child');
    plusBtn?.click();
    fixture.detectChanges();
    expect(fixture.componentInstance.items()[0].quantity).toBe(2);

    const minusBtn = root.querySelector<HTMLButtonElement>('.dp__counter-btn:first-child');
    minusBtn?.click();
    fixture.detectChanges();
    expect(fixture.componentInstance.items()[0].quantity).toBe(1);

    minusBtn?.click();
    fixture.detectChanges();
    expect(fixture.componentInstance.items().length).toBe(0);
  });
});

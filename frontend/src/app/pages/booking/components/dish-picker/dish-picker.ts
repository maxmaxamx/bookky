import { Component, computed, inject, model, signal } from '@angular/core';
import { MenuItem, PreorderItem } from '../../../../core/models/booking.model';
import { BookingService } from '../../../../core/services/booking.service';

type CategoryFilter = 'all' | 'starters' | 'mains' | 'desserts' | 'drinks';

@Component({
  selector: 'app-dish-picker',
  styleUrl: './dish-picker.scss',
  templateUrl: './dish-picker.html',
})
export class DishPicker {
  private readonly bookingService = inject(BookingService);

  readonly items = model<PreorderItem[]>([]);

  protected readonly menu = signal<MenuItem[]>([]);
  protected readonly loading = signal(true);
  protected readonly activeCategory = signal<CategoryFilter>('all');
  protected readonly searchQuery = signal('');

  protected readonly categories: { id: CategoryFilter; label: string; icon: string }[] = [
    { id: 'all', label: 'Все блюда', icon: '🍽️' },
    { id: 'starters', label: 'Закуски и салаты', icon: '🥗' },
    { id: 'mains', label: 'Горячее', icon: '🥩' },
    { id: 'desserts', label: 'Десерты', icon: '🍰' },
    { id: 'drinks', label: 'Напитки', icon: '🍷' },
  ];

  protected readonly filteredMenu = computed(() => {
    const cat = this.activeCategory();
    const query = this.searchQuery().trim().toLowerCase();
    let list = this.menu();

    if (cat !== 'all') {
      list = list.filter((item) => item.category === cat);
    }
    if (query) {
      list = list.filter(
        (item) =>
          item.name.toLowerCase().includes(query) ||
          item.description.toLowerCase().includes(query) ||
          (item.tag && item.tag.toLowerCase().includes(query)),
      );
    }
    return list;
  });

  protected getCategoryCount(catId: CategoryFilter): number {
    if (catId === 'all') return this.menu().length;
    return this.menu().filter((item) => item.category === catId).length;
  }

  protected readonly totalCount = computed(() =>
    this.items().reduce((acc, item) => acc + item.quantity, 0),
  );

  protected readonly totalPrice = computed(() =>
    this.items().reduce((acc, item) => acc + item.price * item.quantity, 0),
  );

  constructor() {
    this.bookingService.getMenu().subscribe({
      next: (menu) => {
        this.menu.set(menu);
        this.loading.set(false);
      },
      error: () => {
        // Fallback default list if needed
        this.loading.set(false);
      },
    });
  }

  protected getQuantity(dishId: string): number {
    const found = this.items().find((item) => item.dishId === dishId);
    return found ? found.quantity : 0;
  }

  protected increase(dish: MenuItem): void {
    this.items.update((current) => {
      const idx = current.findIndex((item) => item.dishId === dish.id);
      if (idx >= 0) {
        return current.map((item, i) =>
          i === idx ? { ...item, quantity: item.quantity + 1 } : item,
        );
      }
      return [
        ...current,
        {
          dishId: dish.id,
          name: dish.name,
          price: dish.price,
          quantity: 1,
        },
      ];
    });
  }

  protected decrease(dish: MenuItem): void {
    this.items.update((current) => {
      const idx = current.findIndex((item) => item.dishId === dish.id);
      if (idx < 0) return current;
      if (current[idx].quantity > 1) {
        return current.map((item, i) =>
          i === idx ? { ...item, quantity: item.quantity - 1 } : item,
        );
      }
      return current.filter((_, i) => i !== idx);
    });
  }

  protected clearAll(): void {
    this.items.set([]);
  }

  protected formatRub(value: number): string {
    return `${new Intl.NumberFormat('ru-RU').format(value)} ₽`;
  }
}

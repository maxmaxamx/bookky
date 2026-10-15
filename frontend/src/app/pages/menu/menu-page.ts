import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MenuItem } from '../../core/models/booking.model';
import { BookingService } from '../../core/services/booking.service';
import { SITE } from '../../core/site';
import { SectionHeading } from '../../shared/components/section-heading/section-heading';

type CategoryFilter = 'all' | 'starters' | 'mains' | 'desserts' | 'drinks';

@Component({
  imports: [RouterLink, SectionHeading],
  selector: 'app-menu-page',
  styleUrl: './menu-page.scss',
  templateUrl: './menu-page.html',
})
export class MenuPage {
  protected readonly site = SITE;

  private readonly bookingService = inject(BookingService);

  protected readonly menu = signal<MenuItem[]>([]);
  protected readonly loading = signal(true);
  protected readonly activeCategory = signal<CategoryFilter>('all');

  protected readonly categories: { id: CategoryFilter; label: string; icon: string }[] = [
    { id: 'all', label: 'Вся карта', icon: '✦' },
    { id: 'starters', label: 'Закуски и салаты', icon: '🥗' },
    { id: 'mains', label: 'Горячие блюда', icon: '🍽' },
    { id: 'desserts', label: 'Десерты', icon: '🍰' },
    { id: 'drinks', label: 'Напитки', icon: '🍹' },
  ];

  protected readonly filteredMenu = computed(() => {
    const cat = this.activeCategory();
    const list = this.menu();
    if (cat === 'all') return list;
    return list.filter((item) => item.category === cat);
  });

  protected readonly categoryTitle = computed(() => {
    const cat = this.activeCategory();
    return this.categories.find((c) => c.id === cat)?.label ?? 'Вся карта';
  });

  constructor() {
    this.bookingService.getMenu().subscribe({
      next: (menu) => {
        this.menu.set(menu);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      },
    });
  }

  protected formatRub(value: number): string {
    return `${new Intl.NumberFormat('ru-RU').format(value)} ₽`;
  }
}

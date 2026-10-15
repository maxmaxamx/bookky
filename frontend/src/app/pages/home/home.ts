import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SITE } from '../../core/site';
import { MenuItem } from '../../core/models/booking.model';
import { BookingService } from '../../core/services/booking.service';
import { SectionHeading } from '../../shared/components/section-heading/section-heading';

@Component({
  imports: [RouterLink, SectionHeading],
  selector: 'app-home',
  styleUrl: './home.scss',
  templateUrl: './home.html',
})
export class Home {
  protected readonly site = SITE;

  private readonly bookingService = inject(BookingService);

  protected readonly dishes = signal<MenuItem[]>([]);
  protected readonly loading = signal(true);

  protected readonly stats = [
    { value: '14', label: 'лет на Пречистенке' },
    { value: '180', label: 'посадочных мест' },
    { value: '40+', label: 'позиций в винном погребе' },
  ];

  /** Показываем 6 избранных блюд на главной. */
  private readonly featuredIds = new Set([
    'dish-1', 'dish-5', 'dish-6', 'dish-7', 'dish-4', 'dish-10',
  ]);

  constructor() {
    this.bookingService.getMenu().subscribe({
      next: (menu) => {
        this.dishes.set(
          menu.filter((d) => this.featuredIds.has(d.id)),
        );
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

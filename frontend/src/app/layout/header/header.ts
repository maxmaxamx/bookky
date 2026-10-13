import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { NAV_ITEMS, SITE } from '../../core/site';
import { AuthService } from '../../core/services/auth.service';
import { Logo } from '../../shared/components/logo/logo';

@Component({
  imports: [RouterLink, RouterLinkActive, Logo],
  selector: 'app-header',
  styleUrl: './header.scss',
  templateUrl: './header.html',
  host: { '(window:scroll)': 'onWindowScroll()' },
})
export class Header {
  protected readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  protected readonly site = SITE;
  protected readonly navItems = NAV_ITEMS;
  /** Хедер становится непрозрачным после прокрутки. */
  protected readonly scrolled = signal(false);
  readonly menuOpen = signal(false);

  constructor() {
    this.auth.restoreSession().subscribe();
  }

  protected onWindowScroll(): void {
    const next = window.scrollY > 24;
    if (next !== this.scrolled()) {
      this.scrolled.set(next);
    }
  }

  protected toggleMenu(): void {
    this.menuOpen.update((open) => !open);
  }

  protected closeMenu(): void {
    this.menuOpen.set(false);
  }

  protected signOut(): void {
    this.auth.logout().subscribe(() => {
      this.closeMenu();
      void this.router.navigateByUrl('/');
    });
  }
}

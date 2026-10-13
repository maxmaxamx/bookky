import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NAV_ITEMS, SITE, SOCIALS } from '../../core/site';
import { Logo } from '../../shared/components/logo/logo';

@Component({
  imports: [RouterLink, Logo],
  selector: 'app-footer',
  styleUrl: './footer.scss',
  templateUrl: './footer.html',
})
export class Footer {
  protected readonly site = SITE;
  protected readonly navItems = NAV_ITEMS;
  protected readonly socials = SOCIALS;
  protected readonly year = new Date().getFullYear();
}

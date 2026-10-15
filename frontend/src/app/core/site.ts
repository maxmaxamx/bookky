/** Общие сведения о ресторане — используются в хедере, футере и на страницах. */
export const SITE = {
  name: 'BOOKKY',
  tagline: 'Ресторан авторской кухни',
  phoneDisplay: '+7 (495) 123-45-67',
  phoneHref: 'tel:+74951234567',
  email: 'hello@bookky.ru',
  address: 'Москва, ул. Пречистенка, 12',
  hours: 'Вт – Вс · 12:00 – 00:00',
  closedNote: 'Понедельник — выходной',
} as const;

export interface NavItem {
  label: string;
  link: string;
  fragment?: string;
}

export const NAV_ITEMS: readonly NavItem[] = [
  { label: 'Главная', link: '/' },
  { label: 'О ресторане', link: '/', fragment: 'about' },
  { label: 'Меню', link: '/menu' },
  { label: 'Бронирование', link: '/booking' },
  { label: 'Контакты', link: '/', fragment: 'contacts' },
];

export const SOCIALS: readonly { label: string; href: string }[] = [
  { label: 'Telegram', href: 'https://t.me/' },
  { label: 'Instagram', href: 'https://instagram.com/' },
  { label: 'VK', href: 'https://vk.com/' },
];

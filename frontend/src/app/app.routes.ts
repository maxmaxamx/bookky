import { Routes } from '@angular/router';
import { accountGuard, adminGuard, userGuard } from './core/auth/auth.guards';

export const routes: Routes = [
  {
    path: '',
    title: 'BOOKKY — ресторан авторской кухни',
    loadComponent: () => import('./pages/home/home').then((m) => m.Home),
  },
  {
    path: 'booking',
    title: 'Бронирование столика — BOOKKY',
    canActivate: [userGuard],
    loadComponent: () => import('./pages/booking/booking').then((m) => m.Booking),
  },
  {
    path: 'login',
    title: 'Вход — BOOKKY',
    data: { mode: 'login' },
    loadComponent: () => import('./pages/auth/auth-page').then((m) => m.AuthPage),
  },
  {
    path: 'register',
    title: 'Регистрация — BOOKKY',
    data: { mode: 'register' },
    loadComponent: () => import('./pages/auth/auth-page').then((m) => m.AuthPage),
  },
  {
    path: 'account',
    title: 'Мои бронирования — BOOKKY',
    canActivate: [accountGuard],
    loadComponent: () => import('./pages/account/account').then((m) => m.Account),
  },
  {
    path: 'admin',
    title: 'Управление бронированиями — BOOKKY',
    canActivate: [adminGuard],
    loadComponent: () => import('./pages/admin/admin').then((m) => m.Admin),
  },
  { path: '**', redirectTo: '' },
];

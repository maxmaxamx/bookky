import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const userGuard: CanActivateFn = (_route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  return auth.restoreSession(true).pipe(
    map((user) => {
      if (user?.role === 'user') return true;
      if (user?.role === 'admin') return router.parseUrl('/admin');
      return router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
    }),
  );
};

export const adminGuard: CanActivateFn = (_route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  return auth.restoreSession(true).pipe(
    map((user) => {
      if (user?.role === 'admin') return true;
      if (user) return router.parseUrl('/account');
      return router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
    }),
  );
};

export const accountGuard: CanActivateFn = (_route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  return auth.restoreSession(true).pipe(
    map((user) => {
      if (user?.role === 'user') return true;
      if (user?.role === 'admin') return router.parseUrl('/admin');
      return router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
    }),
  );
};

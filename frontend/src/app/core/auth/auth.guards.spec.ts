import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, provideRouter, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { firstValueFrom, Observable, of } from 'rxjs';
import { AuthUser } from '../models/auth.model';
import { AuthService } from '../services/auth.service';
import { adminGuard, userGuard } from './auth.guards';

describe('auth route guards', () => {
  let session: AuthUser | null;
  let router: Router;

  beforeEach(() => {
    session = null;
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: { restoreSession: () => of(session) } },
      ],
    });
    router = TestBed.inject(Router);
  });

  async function activate(guard: typeof adminGuard | typeof userGuard) {
    const result = TestBed.runInInjectionContext(() =>
      guard({} as ActivatedRouteSnapshot, { url: '/admin' } as RouterStateSnapshot),
    );
    return firstValueFrom(result as Observable<boolean | UrlTree>);
  }

  it('redirects unauthenticated users to login with the requested route', async () => {
    const result = await activate(adminGuard);
    expect(result instanceof UrlTree).toBe(true);
    expect(router.serializeUrl(result as UrlTree)).toBe('/login?returnUrl=%2Fadmin');
  });

  it('keeps regular users out of the admin route', async () => {
    session = { id: 'user-1', email: 'user@example.com', role: 'user' };
    const result = await activate(adminGuard);
    expect(result instanceof UrlTree).toBe(true);
    expect(router.serializeUrl(result as UrlTree)).toBe('/account');
  });

  it('allows admins into the admin route', async () => {
    session = { id: 'admin-1', email: 'admin@example.com', role: 'admin' };
    expect(await activate(adminGuard)).toBe(true);
  });

  it('redirects admins away from user-only booking routes', async () => {
    session = { id: 'admin-1', email: 'admin@example.com', role: 'admin' };
    const result = await activate(userGuard);
    expect(router.serializeUrl(result as UrlTree)).toBe('/admin');
  });
});

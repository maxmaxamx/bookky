import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { AuthUser } from '../models/auth.model';
import { AuthService } from './auth.service';

const USER: AuthUser = {
  id: 'user-1',
  email: 'guest@example.com',
  role: 'user',
};

describe('AuthService', () => {
  let service: AuthService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(AuthService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpTesting.verify());

  it('restores the user from the HttpOnly-cookie session', async () => {
    const result = firstValueFrom(service.restoreSession());
    const request = httpTesting.expectOne('/api/auth/me');
    expect(request.request.method).toBe('GET');
    request.flush(USER);

    expect(await result).toEqual(USER);
    expect(service.user()).toEqual(USER);
  });

  it('registers through the API and stores only the returned role-safe profile', async () => {
    const result = firstValueFrom(service.register(USER.email, 'long-password'));
    const request = httpTesting.expectOne('/api/auth/register');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({ email: USER.email, password: 'long-password' });
    request.flush(USER);

    expect(await result).toEqual(USER);
    expect(service.user()).toEqual(USER);
  });

  it('logs out through the API and clears the local session', async () => {
    const login = firstValueFrom(service.login(USER.email, 'long-password'));
    httpTesting.expectOne('/api/auth/login').flush(USER);
    await login;

    const result = firstValueFrom(service.logout());
    const request = httpTesting.expectOne('/api/auth/logout');
    expect(request.request.method).toBe('POST');
    request.flush(null);
    await result;

    expect(service.user()).toBeNull();
  });
});

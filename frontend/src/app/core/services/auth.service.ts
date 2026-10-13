import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { Observable, catchError, finalize, map, of, shareReplay, tap } from 'rxjs';
import { AuthUser } from '../models/auth.model';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private sessionRequest?: Observable<AuthUser | null>;
  private sessionLoaded = false;

  readonly user = signal<AuthUser | null>(null);

  restoreSession(refresh = false): Observable<AuthUser | null> {
    if (refresh && !this.sessionRequest) {
      this.sessionLoaded = false;
    }
    if (this.sessionLoaded) {
      return of(this.user());
    }
    if (!this.sessionRequest) {
      this.sessionRequest = this.http.get<AuthUser>('/api/auth/me').pipe(
        tap((user) => this.user.set(user)),
        map((user) => user),
        catchError(() => {
          this.user.set(null);
          return of(null);
        }),
        finalize(() => {
          this.sessionLoaded = true;
          this.sessionRequest = undefined;
        }),
        shareReplay({ bufferSize: 1, refCount: false }),
      );
    }
    return this.sessionRequest;
  }

  login(email: string, password: string): Observable<AuthUser> {
    return this.http.post<AuthUser>('/api/auth/login', { email, password }).pipe(
      tap((user) => this.setUser(user)),
    );
  }

  register(email: string, password: string): Observable<AuthUser> {
    return this.http.post<AuthUser>('/api/auth/register', { email, password }).pipe(
      tap((user) => this.setUser(user)),
    );
  }

  logout(): Observable<void> {
    return this.http.post<void>('/api/auth/logout', {}).pipe(
      tap(() => this.setUser(null)),
      catchError(() => {
        this.setUser(null);
        return of(undefined);
      }),
    );
  }

  private setUser(user: AuthUser | null): void {
    this.user.set(user);
    this.sessionLoaded = true;
    this.sessionRequest = undefined;
  }
}

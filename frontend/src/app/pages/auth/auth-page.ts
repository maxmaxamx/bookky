import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

type AuthMode = 'login' | 'register';

@Component({
  imports: [ReactiveFormsModule, RouterLink],
  selector: 'app-auth-page',
  styleUrl: './auth-page.scss',
  templateUrl: './auth-page.html',
})
export class AuthPage {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly formBuilder = inject(FormBuilder);

  protected readonly mode = this.route.snapshot.data['mode'] as AuthMode;
  protected readonly loading = signal(false);
  protected readonly error = signal('');
  protected readonly isRegister = computed(() => this.mode === 'register');
  protected readonly form = this.formBuilder.nonNullable.group({
    email: ['', [Validators.required, Validators.email, Validators.maxLength(254)]],
    password: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(72)]],
  });

  protected submit(): void {
    this.error.set('');
    if (this.form.invalid || this.loading()) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    const { email, password } = this.form.getRawValue();
    const request = this.isRegister()
      ? this.auth.register(email, password)
      : this.auth.login(email, password);
    request.subscribe({
      next: (user) => {
        const requestedPath = this.route.snapshot.queryParamMap.get('returnUrl');
        const safePath = requestedPath?.startsWith('/') && !requestedPath.startsWith('//')
          ? requestedPath
          : user.role === 'admin'
            ? '/admin'
            : '/account';
        this.loading.set(false);
        void this.router.navigateByUrl(safePath);
      },
      error: (error: unknown) => {
        this.loading.set(false);
        this.error.set(
          error instanceof HttpErrorResponse && error.status === 0
            ? 'Не удаётся связаться с сервером. Запустите backend командой npm run dev и проверьте его настройки.'
            : error instanceof HttpErrorResponse && typeof error.error?.message === 'string'
              ? error.error.message
              : 'Не удалось выполнить вход. Проверьте данные и попробуйте ещё раз.',
        );
      },
    });
  }
}

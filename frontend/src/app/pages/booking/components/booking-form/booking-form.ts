import { Component, DestroyRef, computed, inject, input, output, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { GuestDetails } from '../../../../core/models/booking.model';
import { formatPhone, isValidPhone } from '../../../../core/utils/phone.util';

/** Имя: минимум 2 символа, только буквы, пробел, дефис и апостроф. */
const NAME_PATTERN = /^[А-Яа-яЁёA-Za-z][А-Яа-яЁёA-Za-z\s'-]{1,39}$/;
const MAX_COMMENT_LENGTH = 200;

/** Телефон валиден, если в нём 11 цифр (пустое значение пропускаем — за обязательность отвечает Validators.required). */
const phoneValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  const value = `${control.value ?? ''}`.trim();
  if (!value) {
    return null;
  }
  return isValidPhone(value) ? null : { phone: true };
};

@Component({
  imports: [ReactiveFormsModule],
  selector: 'app-booking-form',
  styleUrl: './booking-form.scss',
  templateUrl: './booking-form.html',
})
export class BookingForm {
  /** Форма активна, когда выбрано время брони. */
  readonly ready = input(true);
  readonly submitting = input(false);
  readonly apiError = input<string | null>(null);
  readonly submitted = output<GuestDetails>();

  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly maxCommentLength = MAX_COMMENT_LENGTH;
  protected readonly showErrors = signal(false);

  protected readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.pattern(NAME_PATTERN)]],
    phone: ['', [Validators.required, phoneValidator]],
    comment: ['', [Validators.maxLength(MAX_COMMENT_LENGTH)]],
    consent: [false, [Validators.requiredTrue]],
  });

  /**
   * Приложение работает без zone.js, поэтому состояния формы превращаем в сигналы:
   * computed-ошибки и активность кнопки пересчитываются на каждое событие контролов.
   */
  private readonly formEvents = toSignal(this.form.events, { initialValue: null });

  protected readonly canSubmit = computed(() => {
    this.formEvents();
    return this.form.valid && this.ready() && !this.submitting();
  });

  protected readonly errors = computed(() => {
    this.formEvents();
    const { name, phone, comment, consent } = this.form.controls;
    const visible = (control: AbstractControl) =>
      control.invalid && (control.touched || this.showErrors());

    return {
      name: visible(name) ? this.nameError() : '',
      phone: visible(phone) ? this.phoneError() : '',
      comment: visible(comment) ? `Комментарий не длиннее ${MAX_COMMENT_LENGTH} символов.` : '',
      consent: visible(consent)
        ? 'Без согласия на обработку данных мы не сможем принять бронь.'
        : '',
    };
  });

  protected readonly commentLength = computed(() => {
    this.formEvents();
    return `${this.form.controls.comment.value ?? ''}`.length;
  });

  constructor() {
    // Автоматическая маска телефона по мере ввода.
    // Повторный setValue не зацикливается: форматирование идемпотентно.
    this.form.controls.phone.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((value) => {
        const formatted = formatPhone(value);
        if (formatted !== value) {
          this.form.controls.phone.setValue(formatted);
        }
      });
  }

  /** Очистка формы после успешной брони. */
  reset(): void {
    this.form.reset({ name: '', phone: '', comment: '', consent: false });
    this.showErrors.set(false);
  }

  protected submit(): void {
    this.showErrors.set(true);

    if (!this.canSubmit()) {
      this.form.markAllAsTouched();
      return;
    }

    const { name, phone, comment } = this.form.getRawValue();
    this.submitted.emit({
      name: name.trim(),
      phone,
      comment: comment.trim(),
      consent: true,
    });
  }

  private nameError(): string {
    const control = this.form.controls.name;
    if (control.hasError('required')) {
      return 'Укажите имя — администратор обратится к вам по имени.';
    }
    return 'Имя: 2–40 символов, только буквы, пробел и дефис.';
  }

  private phoneError(): string {
    const control = this.form.controls.phone;
    if (control.hasError('required')) {
      return 'Телефон нужен, чтобы подтвердить бронирование.';
    }
    return 'Введите номер полностью, например +7 (999) 123-45-67.';
  }
}

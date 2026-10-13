const NON_DIGITS = /\D/g;

export function phoneDigits(value: string): string {
  return value.replace(NON_DIGITS, '');
}

/**
 * Приводит ввод к маске +7 (999) 123-45-67 по мере набора.
 * Номера, начинающиеся с 8, автоматически переводятся в формат +7.
 */
export function formatPhone(value: string): string {
  let digits = phoneDigits(value);
  if (!digits) {
    return '';
  }
  if (digits.startsWith('8')) {
    digits = `7${digits.slice(1)}`;
  } else if (!digits.startsWith('7')) {
    digits = `7${digits}`;
  }
  digits = digits.slice(0, 11);

  const rest = digits.slice(1);
  let formatted = '+7';
  if (rest.length > 0) {
    formatted += ` (${rest.slice(0, 3)}`;
  }
  if (rest.length >= 4) {
    formatted += `) ${rest.slice(3, 6)}`;
  }
  if (rest.length >= 7) {
    formatted += `-${rest.slice(6, 8)}`;
  }
  if (rest.length >= 9) {
    formatted += `-${rest.slice(8, 10)}`;
  }
  return formatted;
}

/** Валидным считается полный российский номер из 11 цифр. */
export function isValidPhone(value: string): boolean {
  const digits = phoneDigits(value);
  return digits.length === 11 && (digits.startsWith('7') || digits.startsWith('8'));
}

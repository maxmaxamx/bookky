import { formatPhone, isValidPhone, phoneDigits } from './phone.util';

describe('phone.util', () => {
  it('приводит ввод к маске +7 (999) 123-45-67', () => {
    expect(formatPhone('9991234567')).toBe('+7 (999) 123-45-67');
    expect(formatPhone('89991234567')).toBe('+7 (999) 123-45-67');
    expect(formatPhone('+7 999 123 45 67')).toBe('+7 (999) 123-45-67');
    expect(formatPhone('')).toBe('');
    expect(formatPhone('9')).toBe('+7 (9');
    expect(formatPhone('999123456789999')).toBe('+7 (999) 123-45-67');
  });

  it('проверяет полноту номера', () => {
    expect(isValidPhone('+7 (999) 123-45-67')).toBe(true);
    expect(isValidPhone('8 (999) 123-45-67')).toBe(true);
    expect(isValidPhone('+7 (999) 123-45')).toBe(false);
    expect(isValidPhone('')).toBe(false);
  });

  it('извлекает только цифры', () => {
    expect(phoneDigits('+7 (999) 123-45-67')).toBe('79991234567');
  });
});

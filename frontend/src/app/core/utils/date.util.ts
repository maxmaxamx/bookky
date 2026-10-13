const WEEKDAYS_SHORT = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
const WEEKDAYS_LONG = [
  'Понедельник',
  'Вторник',
  'Среда',
  'Четверг',
  'Пятница',
  'Суббота',
  'Воскресенье',
];
const MONTHS_PREPOSITIONAL = [
  'января',
  'февраля',
  'марта',
  'апреля',
  'мая',
  'июня',
  'июля',
  'августа',
  'сентября',
  'октября',
  'ноября',
  'декабря',
];
const MONTHS_NOMINATIVE = [
  'Январь',
  'Февраль',
  'Март',
  'Апрель',
  'Май',
  'Июнь',
  'Июль',
  'Август',
  'Сентябрь',
  'Октябрь',
  'Ноябрь',
  'Декабрь',
];

/** Индекс дня недели, где 0 — понедельник. */
export function weekdayIndex(date: Date): number {
  return (date.getDay() + 6) % 7;
}

export function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

/** Обратное преобразование ISO-строки (yyyy-mm-dd) в локальную дату. */
export function fromIsoDate(iso: string): Date {
  const [year, month, day] = iso.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export function addDays(date: Date, amount: number): Date {
  const next = startOfDay(date);
  next.setDate(next.getDate() + amount);
  return next;
}

export function addMonths(date: Date, amount: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1);
}

export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/** ISO-дата без времени: 2026-10-02. */
export function toIsoDate(date: Date): string {
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

/** Понедельник — выходной день ресторана. */
export function isClosedDay(date: Date): boolean {
  return date.getDay() === 1;
}

export function isPastDay(date: Date, today: Date = new Date()): boolean {
  return startOfDay(date).getTime() < startOfDay(today).getTime();
}

export function isToday(date: Date, today: Date = new Date()): boolean {
  return isSameDay(date, today);
}

/** День недоступен для брони: прошедшая дата или выходной. */
export function isUnavailableDay(date: Date, today: Date = new Date()): boolean {
  return isPastDay(date, today) || isClosedDay(date);
}

/** Сетка календаря месяцем: недели по 7 дней, неделя начинается с понедельника. */
export function monthMatrix(viewMonth: Date): (Date | null)[][] {
  const year = viewMonth.getFullYear();
  const month = viewMonth.getMonth();
  const offset = weekdayIndex(new Date(year, month, 1));
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells: (Date | null)[] = Array.from({ length: offset }, () => null);
  for (let day = 1; day <= daysInMonth; day++) {
    cells.push(new Date(year, month, day));
  }
  while (cells.length % 7 !== 0) {
    cells.push(null);
  }

  return Array.from({ length: cells.length / 7 }, (_, week) => cells.slice(week * 7, week * 7 + 7));
}

export function weekdayShort(date: Date): string {
  return WEEKDAYS_SHORT[weekdayIndex(date)];
}

export function weekdayLong(date: Date): string {
  return WEEKDAYS_LONG[weekdayIndex(date)];
}

export function monthTitle(date: Date): string {
  return `${MONTHS_NOMINATIVE[date.getMonth()]} ${date.getFullYear()}`;
}

/** Человекочитаемая дата: «Пятница, 2 октября». */
export function formatDateLong(date: Date): string {
  return `${weekdayLong(date)}, ${date.getDate()} ${MONTHS_PREPOSITIONAL[date.getMonth()]}`;
}

/** Короткая дата для календаря: «2 окт». */
export function formatDateShort(date: Date): string {
  return `${date.getDate()} ${MONTHS_PREPOSITIONAL[date.getMonth()].slice(0, 3)}`;
}

/** Русские формы множественного числа: 1 гость, 2 гостя, 5 гостей. */
export function plural(
  count: number,
  forms: readonly [one: string, few: string, many: string],
): string {
  const mod10 = Math.abs(count) % 10;
  const mod100 = Math.abs(count) % 100;
  if (mod10 === 1 && mod100 !== 11) return forms[0];
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return forms[1];
  return forms[2];
}

export function guestsLabel(count: number): string {
  return `${count} ${plural(count, ['гость', 'гостя', 'гостей'])}`;
}

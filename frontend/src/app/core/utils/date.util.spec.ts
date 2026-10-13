import {
  addDays,
  formatDateLong,
  fromIsoDate,
  guestsLabel,
  isClosedDay,
  isPastDay,
  isUnavailableDay,
  monthMatrix,
  monthTitle,
  plural,
  startOfMonth,
  toIsoDate,
  weekdayShort,
} from './date.util';

describe('date.util', () => {
  /** Пятница, 2 октября 2026. */
  const friday = new Date(2026, 9, 2);
  /** Понедельник, 5 октября 2026 — выходной день ресторана. */
  const monday = new Date(2026, 9, 5);

  it('определяет выходной день', () => {
    expect(isClosedDay(monday)).toBe(true);
    expect(isClosedDay(friday)).toBe(false);
  });

  it('считает прошедшие и недоступные дни', () => {
    expect(isPastDay(new Date(2026, 8, 30), friday)).toBe(true);
    expect(isPastDay(friday, friday)).toBe(false);
    expect(isUnavailableDay(monday, friday)).toBe(true);
    expect(isUnavailableDay(friday, friday)).toBe(false);
  });

  it('строит сетку месяца, начиная с понедельника', () => {
    const weeks = monthMatrix(new Date(2026, 9, 1));

    expect(weeks.length).toBe(5);
    expect(weeks.every((week) => week.length === 7)).toBe(true);
    // 1 октября 2026 — четверг, значит первые три ячейки пустые
    expect(weeks[0][0]).toBeNull();
    expect(weeks[0][3]?.getDate()).toBe(1);
    expect(weeks.flat().filter(Boolean).length).toBe(31);
  });

  it('форматирует даты по-русски', () => {
    expect(formatDateLong(friday)).toBe('Пятница, 2 октября');
    expect(monthTitle(new Date(2026, 9, 1))).toBe('Октябрь 2026');
    expect(weekdayShort(friday)).toBe('Пт');
  });

  it('преобразует дату в ISO-строку и обратно', () => {
    expect(toIsoDate(friday)).toBe('2026-10-02');
    expect(toIsoDate(fromIsoDate('2026-10-02'))).toBe('2026-10-02');
    expect(fromIsoDate('2026-10-02').getDate()).toBe(2);
  });

  it('склоняет количество гостей', () => {
    expect(guestsLabel(1)).toBe('1 гость');
    expect(guestsLabel(2)).toBe('2 гостя');
    expect(guestsLabel(5)).toBe('5 гостей');
    expect(guestsLabel(11)).toBe('11 гостей');
    expect(guestsLabel(21)).toBe('21 гость');
    expect(plural(3, ['столик', 'столика', 'столиков'])).toBe('столика');
  });

  it('смещает даты и определяет начало месяца', () => {
    expect(toIsoDate(addDays(friday, 3))).toBe('2026-10-05');
    expect(startOfMonth(new Date(2026, 9, 17)).getDate()).toBe(1);
  });
});

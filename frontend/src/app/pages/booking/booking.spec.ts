import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { BookingConfirmation, BookingRequest, TimeSlot } from '../../core/models/booking.model';
import { BookingService } from '../../core/services/booking.service';
import { Booking } from './booking';

const SLOTS: TimeSlot[] = [
  { id: 'day-13-00', time: '13:00', period: 'day', available: true, tablesLeft: 3 },
  { id: 'evening-18-00', time: '18:00', period: 'evening', available: true, tablesLeft: 2 },
  { id: 'evening-18-30', time: '18:30', period: 'evening', available: false, tablesLeft: 0 },
  { id: 'evening-19-00', time: '19:00', period: 'evening', available: true, tablesLeft: 1 },
];

/** Заглушка сервиса: слоты приходят синхронно, без задержки сети. */
const bookingServiceStub = {
  getSlots: () => of(SLOTS),
  getTables: () => of([
    { id: 'T01', seats: 2, zone: 'У окна', position: 't01', available: true },
    { id: 'T04', seats: 4, zone: 'Основной зал', position: 't04', available: true },
    { id: 'T08', seats: 8, zone: 'У камина', position: 't08', available: true },
  ]),
  getTableDetails: (tableId: string | null) =>
    [
      { id: 'T01', seats: 2, zone: 'У окна', position: 't01' },
      { id: 'T04', seats: 4, zone: 'Основной зал', position: 't04' },
      { id: 'T08', seats: 8, zone: 'У камина', position: 't08' },
    ].find((table) => table.id === tableId),
  createBooking: (request: BookingRequest) =>
    of<BookingConfirmation>({
      ...request,
      id: 'BK-4242',
      table: `Стол ${request.tableId}, в основном зале`,
      status: 'Pending',
      createdAt: new Date().toISOString(),
    }),
  getMenu: () => of([]),
};

function availableSlot(root: HTMLElement, time: string): HTMLButtonElement {
  const buttons = Array.from(
    root.querySelectorAll<HTMLButtonElement>('app-time-slots button:not([disabled])'),
  );
  const button = buttons.find((item) => item.textContent?.includes(time));
  if (!button) {
    throw new Error(`Свободный слот ${time} не найден`);
  }
  return button;
}

function submitButton(root: HTMLElement): HTMLButtonElement {
  const button = root.querySelector<HTMLButtonElement>('app-booking-form button[type="submit"]');
  if (!button) {
    throw new Error('Кнопка отправки формы не найдена');
  }
  return button;
}

function tableButton(root: HTMLElement, tableId: string): HTMLButtonElement {
  const button = root.querySelector<HTMLButtonElement>(
    `.tp__table[aria-label^="Стол ${tableId},"]`,
  );
  if (!button) {
    throw new Error(`Стол ${tableId} не найден`);
  }
  return button;
}

function typeInto(input: HTMLInputElement, value: string): void {
  input.value = value;
  input.dispatchEvent(new Event('input'));
}

describe('Booking', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Booking],
      providers: [{ provide: BookingService, useValue: bookingServiceStub }],
    }).compileComponents();
  });

  async function render(): Promise<{ root: HTMLElement; whenStable: () => Promise<void> }> {
    const fixture = TestBed.createComponent(Booking);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    return {
      root: fixture.nativeElement as HTMLElement,
      whenStable: async () => {
        await fixture.whenStable();
        fixture.detectChanges();
      },
    };
  }

  it('отрисовывает заголовок и сводку заказа', async () => {
    const { root } = await render();

    expect(root.querySelector('h1')?.textContent).toContain('Забронировать столик');
    expect(root.querySelector('app-booking-summary')?.textContent).toContain('не выбрано');
    expect(availableSlot(root, '18:00')).toBeTruthy();
  });

  it('не отправляет форму без выбранного времени', async () => {
    const { root, whenStable } = await render();

    const submit = submitButton(root);
    expect(submit.disabled).toBe(true);

    submit.click();
    await whenStable();

    expect(root.querySelector('[role="dialog"]')).toBeNull();
  });

  it('не активирует отправку, пока не выбран столик', async () => {
    const { root, whenStable } = await render();

    availableSlot(root, '18:00').click();
    await whenStable();

    expect(submitButton(root).disabled).toBe(true);
    expect(tableButton(root, 'T01').disabled).toBe(false);
    tableButton(root, 'T01').click();
    await whenStable();
    expect(tableButton(root, 'T01').getAttribute('aria-pressed')).toBe('true');
    expect(submitButton(root).disabled).toBe(false);
  });

  it('отключает столы, вмещающие меньше выбранного числа гостей', async () => {
    const { root, whenStable } = await render();

    availableSlot(root, '18:00').click();
    await whenStable();
    tableButton(root, 'T01').click();
    await whenStable();

    const sixGuests = Array.from(root.querySelectorAll<HTMLButtonElement>('.gc-preset')).find(
      (button) => button.textContent?.trim() === '6',
    );
    sixGuests?.click();
    await whenStable();

    expect(tableButton(root, 'T01').disabled).toBe(true);
    expect(tableButton(root, 'T08').disabled).toBe(false);
    expect(root.querySelector('.tp__table--selected')).toBeNull();
  });

  it('показывает ошибки валидации при пустой форме', async () => {
    const { root, whenStable } = await render();

    availableSlot(root, '18:00').click();
    await whenStable();
    tableButton(root, 'T01').click();
    await whenStable();

    submitButton(root).click();
    await whenStable();

    expect(root.querySelector('[role="dialog"]')).toBeNull();
    expect(root.textContent).toContain('Укажите имя');
    expect(root.textContent).toContain('Телефон нужен');
    expect(root.textContent).toContain('Без согласия');
  });

  it('проверяет формат телефона', async () => {
    const { root, whenStable } = await render();

    availableSlot(root, '18:00').click();
    await whenStable();
    tableButton(root, 'T01').click();
    await whenStable();

    const phone = root.querySelector<HTMLInputElement>('#booking-phone')!;
    typeInto(phone, '999123');
    await whenStable();

    submitButton(root).click();
    await whenStable();
    expect(root.textContent).toContain('Введите номер полностью');
  });

  it('бронирует столик и показывает модалку с подтверждением', async () => {
    const { root, whenStable } = await render();

    availableSlot(root, '18:00').click();
    await whenStable();
    tableButton(root, 'T01').click();
    await whenStable();

    typeInto(root.querySelector<HTMLInputElement>('#booking-name')!, 'Анна');
    const phone = root.querySelector<HTMLInputElement>('#booking-phone')!;
    typeInto(phone, '9991234567');

    const consent = root.querySelector<HTMLInputElement>('input[type="checkbox"]')!;
    consent.checked = true;
    consent.dispatchEvent(new Event('change'));

    await whenStable();

    // маска телефона применилась на лету
    expect(phone.value).toBe('+7 (999) 123-45-67');

    submitButton(root).click();
    await whenStable();

    const dialog = root.querySelector<HTMLElement>('[role="dialog"]');
    expect(dialog).not.toBeNull();
    expect(dialog?.textContent).toContain('Бронирование подтверждено');
    expect(dialog?.textContent).toContain('BK-4242');
    expect(dialog?.textContent).toContain('Анна');
    expect(dialog?.textContent).toContain('T01');
  });
});

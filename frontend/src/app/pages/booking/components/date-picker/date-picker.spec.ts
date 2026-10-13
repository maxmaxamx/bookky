import { TestBed } from '@angular/core/testing';
import { DatePicker } from './date-picker';

describe('DatePicker', () => {
  /** Пятница, 2 октября 2026. */
  const friday = new Date(2026, 9, 2);

  async function render() {
    const fixture = TestBed.createComponent(DatePicker);
    fixture.componentRef.setInput('today', friday);
    fixture.componentRef.setInput('selected', friday);
    fixture.detectChanges();
    await fixture.whenStable();
    return fixture;
  }

  it('показывает месяц выбранной даты и переключает месяцы', async () => {
    const fixture = await render();
    const root = fixture.nativeElement as HTMLElement;

    expect(root.textContent).toContain('Октябрь 2026');

    root.querySelector<HTMLButtonElement>('button[aria-label="Следующий месяц"]')!.click();
    fixture.detectChanges();
    expect(root.textContent).toContain('Ноябрь 2026');

    // повторное переключение — реконсиляция списка дней с пустыми ячейками
    root.querySelector<HTMLButtonElement>('button[aria-label="Следующий месяц"]')!.click();
    fixture.detectChanges();
    expect(root.textContent).toContain('Декабрь 2026');
  });

  it('закрывает прошедшие даты и выходные дни', async () => {
    const fixture = await render();
    const root = fixture.nativeElement as HTMLElement;

    const mondays = Array.from(
      root.querySelectorAll<HTMLButtonElement>('button[aria-label^="Понедельник"]'),
    );
    expect(mondays.length).toBeGreaterThan(0);
    expect(mondays.every((button) => button.disabled)).toBe(true);

    const pastDays = Array.from(
      root.querySelectorAll<HTMLButtonElement>('button[aria-label$="— ресторан закрыт"]'),
    );
    expect(pastDays.length).toBeGreaterThan(0);
    expect(pastDays.every((button) => button.disabled)).toBe(true);
  });

  it('выбирает свободный день и сообщает об этом родителю', async () => {
    const fixture = await render();
    const root = fixture.nativeElement as HTMLElement;

    const selected: Date[] = [];
    fixture.componentInstance.selected.subscribe((value) => selected.push(value));

    root.querySelector<HTMLButtonElement>('button[aria-label^="Вторник, 6 октября"]')!.click();
    fixture.detectChanges();

    expect(selected.length).toBe(1);
    expect(selected[0].getDate()).toBe(6);
    expect(fixture.componentInstance.selected().getDate()).toBe(6);
  });
});

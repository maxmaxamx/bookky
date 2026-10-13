import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Home } from './home';

describe('Home', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Home],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  it('рендерит якорные секции для навигации и меню', async () => {
    const fixture = TestBed.createComponent(Home);
    fixture.detectChanges();
    await fixture.whenStable();

    const root = fixture.nativeElement as HTMLElement;

    expect(root.querySelector('#about')).not.toBeNull();
    expect(root.querySelector('#menu')).not.toBeNull();
    expect(root.querySelector('#contacts')).not.toBeNull();
    expect(root.textContent).toContain('Тартар из тунца');
    expect(root.textContent).toContain('Забронировать столик');
  });
});

import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SITE } from '../../core/site';
import { SectionHeading } from '../../shared/components/section-heading/section-heading';

interface Dish {
  name: string;
  description: string;
  price: string;
  tag?: string;
}

@Component({
  imports: [RouterLink, SectionHeading],
  selector: 'app-home',
  styleUrl: './home.scss',
  templateUrl: './home.html',
})
export class Home {
  protected readonly site = SITE;

  protected readonly stats = [
    { value: '14', label: 'лет на Пречистенке' },
    { value: '180', label: 'посадочных мест' },
    { value: '40+', label: 'позиций в винном погребе' },
  ];

  protected readonly dishes: readonly Dish[] = [
    {
      name: 'Тартар из тунца',
      description: 'Сицилийские томаты, дижонский крем, тосты с трюфелем',
      price: '1 190 ₽',
      tag: 'Хит',
    },
    {
      name: 'Ризотто с белыми грибами',
      description: 'Рис карнароли, выдержанный пармезан, свежий тимьян',
      price: '980 ₽',
    },
    {
      name: 'Треска на угле',
      description: 'Брокколини, соус из белого вина, обожжённый лимон',
      price: '1 450 ₽',
    },
    {
      name: 'Каре ягнёнка',
      description: 'Пюре из тыквы, ягодный жю, ветка розмарина',
      price: '2 100 ₽',
      tag: 'Шефа',
    },
    {
      name: 'Томатный суп с копчёной сметаной',
      description: 'Печёные томаты, базилик, оливковое масло Frantoio',
      price: '690 ₽',
    },
    {
      name: 'Шоколадный фондан',
      description: 'Фундук, соль Мальдон, ванильное мороженое',
      price: '640 ₽',
    },
  ];
}

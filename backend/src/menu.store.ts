export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: 'starters' | 'mains' | 'desserts' | 'drinks';
  tag?: string;
  calories?: number;
  weightGrams?: number;
  image?: string;
}

export interface OrderItem {
  dishId: string;
  name: string;
  price: number;
  quantity: number;
}

export const MENU_ITEMS: readonly MenuItem[] = [
  // Закуски (Starters)
  {
    id: 'dish-1',
    name: 'Тартар из тунца',
    description: 'Сицилийские томаты, дижонский крем, хрустящие тосты с трюфельным маслом',
    price: 1190,
    category: 'starters',
    tag: 'Хит',
    weightGrams: 180,
    image: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=480&h=320&fit=crop&q=80',
  },
  {
    id: 'dish-2',
    name: 'Брускетта с камчатским крабом',
    description: 'Мякоть краба, спелый авокадо, цитрусовая заправка, микрозелень',
    price: 890,
    category: 'starters',
    weightGrams: 160,
    image: 'https://images.unsplash.com/photo-1572695157366-5e585ab2b69f?w=480&h=320&fit=crop&q=80',
  },
  {
    id: 'dish-3',
    name: 'Салат с хрустящими баклажанами',
    description: 'Страчателла, спелые узбекские томаты, сладкий соус чили, кинза',
    price: 790,
    category: 'starters',
    tag: 'Популярное',
    weightGrams: 230,
    image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=480&h=320&fit=crop&q=80',
  },
  {
    id: 'dish-4',
    name: 'Томатный суп с копчёной сметаной',
    description: 'Печёные томаты, базилик, фермерская копчёная сметана, масло Frantoio',
    price: 690,
    category: 'starters',
    weightGrams: 280,
    image: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=480&h=320&fit=crop&q=80',
  },

  // Горячие блюда (Mains)
  {
    id: 'dish-5',
    name: 'Каре ягнёнка',
    description: 'Нежное каре на гриле, пюре из печёной тыквы, ягодный жю, розмарин',
    price: 2100,
    category: 'mains',
    tag: 'Шефа',
    weightGrams: 320,
    image: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=480&h=320&fit=crop&q=80',
  },
  {
    id: 'dish-6',
    name: 'Ризотто с белыми грибами',
    description: 'Итальянский рис карнароли, лесные белые грибы, выдержанный пармезан',
    price: 980,
    category: 'mains',
    weightGrams: 260,
    image: 'https://images.unsplash.com/photo-1476124369491-e7addf5db371?w=480&h=320&fit=crop&q=80',
  },
  {
    id: 'dish-7',
    name: 'Треска на угле',
    description: 'Филе трески, нежные брокколини, велюте из белого вина, обожжённый лимон',
    price: 1450,
    category: 'mains',
    weightGrams: 290,
    image: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=480&h=320&fit=crop&q=80',
  },
  {
    id: 'dish-8',
    name: 'Стейк Рибай с перечным соусом',
    description: 'Мраморная говядина зернового откорма, спаржа на гриле, соус из зелёного перца',
    price: 2850,
    category: 'mains',
    tag: 'Премиум',
    weightGrams: 350,
    image: 'https://images.unsplash.com/photo-1558030006-450675393462?w=480&h=320&fit=crop&q=80',
  },
  {
    id: 'dish-9',
    name: 'Паста с морепродуктами в соусе биск',
    description: 'Тальятелле ручной лепки, тигровые креветки, кальмары, мидии, ароматный биск',
    price: 1290,
    category: 'mains',
    weightGrams: 310,
    image: 'https://images.unsplash.com/photo-1563379926898-05f4575a45d8?w=480&h=320&fit=crop&q=80',
  },

  // Десерты (Desserts)
  {
    id: 'dish-10',
    name: 'Шоколадный фондан',
    description: 'Тёплый шоколадный кекс с жидкой сердцевиной, пьемонтский фундук, ванильное мороженое',
    price: 640,
    category: 'desserts',
    tag: 'Десерт',
    weightGrams: 160,
    image: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=480&h=320&fit=crop&q=80',
  },
  {
    id: 'dish-11',
    name: 'Баскский чизкейк с солёной карамелью',
    description: 'Карамелизированная корочка, нежная кремовая текстура сливочного сыра',
    price: 580,
    category: 'desserts',
    weightGrams: 170,
    image: 'https://images.unsplash.com/photo-1567171466295-4afa63d45416?w=480&h=320&fit=crop&q=80',
  },
  {
    id: 'dish-12',
    name: 'Тирамису на темном роме',
    description: 'Савоярди с эспрессо, маскарпоне, какао Criollo, нотки выдержанного рома',
    price: 550,
    category: 'desserts',
    weightGrams: 190,
    image: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=480&h=320&fit=crop&q=80',
  },

  // Напитки (Drinks)
  {
    id: 'dish-13',
    name: 'Авторский лимонад Малина-Юдзу',
    description: 'Натуральное пюре спелой малины, японский цитрус юдзу, мята, газированная вода',
    price: 420,
    category: 'drinks',
    weightGrams: 400,
    image: 'https://images.unsplash.com/photo-1621263764928-df1444c5e859?w=480&h=320&fit=crop&q=80',
  },
  {
    id: 'dish-14',
    name: 'Свежевыжатый гранатовый сок',
    description: '100% сок спелых азербайджанских гранатов прямого отжима',
    price: 490,
    category: 'drinks',
    weightGrams: 250,
    image: 'https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=480&h=320&fit=crop&q=80',
  },
  {
    id: 'dish-15',
    name: 'Чай горный с чабрецом и алтайским мёдом',
    description: 'Сбор высокогорных трав, тимьян, липовый мёд, подаётся в стеклянном чайнике',
    price: 450,
    category: 'drinks',
    weightGrams: 600,
    image: 'https://images.unsplash.com/photo-1597318181409-cf64d0b5d8a2?w=480&h=320&fit=crop&q=80',
  },
];

export function getMenuItems(): readonly MenuItem[] {
  return MENU_ITEMS;
}

export function validateAndSanitizePreorder(rawItems: unknown): OrderItem[] | undefined {
  if (!rawItems || !Array.isArray(rawItems) || rawItems.length === 0) {
    return undefined;
  }

  const sanitized: OrderItem[] = [];
  for (const item of rawItems) {
    if (typeof item !== 'object' || item === null) continue;
    const dishId = String((item as { dishId?: unknown }).dishId ?? '');
    const quantity = Number((item as { quantity?: unknown }).quantity);
    if (!dishId || !Number.isInteger(quantity) || quantity <= 0 || quantity > 20) {
      continue;
    }
    const foundDish = MENU_ITEMS.find((d) => d.id === dishId);
    if (!foundDish) continue;

    sanitized.push({
      dishId: foundDish.id,
      name: foundDish.name,
      price: foundDish.price,
      quantity,
    });
  }

  return sanitized.length > 0 ? sanitized : undefined;
}

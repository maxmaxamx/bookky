/** Время суток, к которому относится слот бронирования. */
export type SlotPeriod = 'day' | 'evening';

/** Слот времени, доступный (или занятый) для выбранной даты. */
export interface TimeSlot {
  id: string;
  /** Время в формате HH:mm. */
  time: string;
  period: SlotPeriod;
  available: boolean;
  /** Сколько столиков ещё свободно на это время. */
  tablesLeft: number;
}

/** Столик ресторана и его доступность на выбранный слот. */
export interface RestaurantTable {
  id: string;
  seats: number;
  zone: string;
  position: string;
  available: boolean;
}

/** Данные, которые гость заполняет в форме. */
export interface GuestDetails {
  name: string;
  phone: string;
  comment: string;
  consent: boolean;
}

/** Предзаказ конкретного блюда. */
export interface PreorderItem {
  dishId: string;
  name: string;
  price: number;
  quantity: number;
}

/** Позиция из меню ресторана. */
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

/** Столик с информацией для администратора. */
export interface AdminTableDetail extends RestaurantTable {
  activeBooking?: BookingConfirmation;
}

/** Полный запрос на бронирование. */
export interface BookingRequest {
  date: string;
  time: string;
  guests: number;
  tableId: string;
  name: string;
  phone: string;
  comment?: string;
  preorder?: PreorderItem[];
}

/** Подтверждение успешной брони. */
export interface BookingConfirmation extends BookingRequest {
  /** Номер брони, например BK-4821. */
  id: string;
  /** Рекомендованный столик. */
  table: string;
  status: BookingStatus;
  createdAt: string;
}

export type BookingStatus = 'Pending' | 'Confirmed' | 'Cancelled';

export const MIN_GUESTS = 1;
export const MAX_GUESTS = 12;
/** От этого количества гостей нужен банкетный зал, онлайн-бронь недоступна. */
export const BANQUET_THRESHOLD = 10;

export const SLOT_PERIOD_LABELS: Record<SlotPeriod, string> = {
  day: 'Дневные слоты',
  evening: 'Вечерние слоты',
};


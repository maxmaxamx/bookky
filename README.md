# BOOKKY 🍽️✨

> **Bilingual Documentation / Двуязычная документация:**  
> [English](#english) | [Русский](#русский)

---

<a name="english"></a>
## English

BOOKKY is a modern full-stack web application for restaurant table reservations and kitchen pre-orders. It features a luxury dark aesthetic with gold accents, an interactive restaurant floor map, online menu pre-ordering, personal guest accounts, and a comprehensive management panel for restaurant administrators.

---

### Table of Contents
1. [Key Features](#features-en)
2. [Tech Stack](#tech-stack-en)
3. [Architecture & Project Structure](#structure-en)
4. [Prerequisites](#prerequisites-en)
5. [Getting Started](#getting-started-en)
6. [Environment Variables](#env-en)
7. [API Endpoints](#api-en)
8. [Database & Persistence](#database-en)
9. [Testing & Quality Assurance](#testing-en)

---

<a name="features-en"></a>
### Key Features

* **6-Step Interactive Reservation Wizard:**
  1. **Date Selection:** 14-day booking horizon with Monday closed-day handling and quick-pick chips.
  2. **Time Slots:** Day and evening slot periods with live table counters (`N tables left`) and 2-hour dining intervals.
  3. **Guest Counter:** Stepper and presets supporting 1–12 guests, with banquet hall tips for large parties.
  4. **Table Picker:** Dual-mode selection — visual interactive restaurant floor map (with real-time seating layouts) and a mobile-friendly list card view.
  5. **Kitchen Pre-order:** Browse dishes across multiple categories (starters, mains, desserts, drinks) with search, portion counters, calories, weights, and live cart summary.
  6. **Guest Details & Confirmation:** Client-side phone mask formatting, live validation, and a modal confirmation card.
* **Mobile-First Experience:**
  - Sticky bottom reservation status bar on mobile devices (`safe-area-inset-bottom` compliant) with one-tap step navigation.
  - Anti-zoom 16px input styling for iOS Safari.
  - Smooth touch scroll and swipe hints on mobile floor plans.
* **Personal Guest Account:**
  - View current and upcoming bookings with full pre-order breakdowns.
  - Automatic exclusion and database purging of expired/past reservations.
  - One-click booking cancellation.
* **Admin Management Dashboard:**
  - Real-time floor plan occupancy inspector by date and time slot.
  - Status updates (`Pending`, `Confirmed`, `Cancelled`) with table conflict checks.
  - Filter reservations by date and status.
* **Security & Auth:**
  - Role-based authentication (`user`, `admin`).
  - Secure HTTP-only SameSite session cookies powered by signed JWTs (8-hour expiration).
  - Bcrypt password hashing.

---

<a name="tech-stack-en"></a>
### Tech Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | Angular 22 (Standalone Components, Signals, Computed, Effects), TypeScript, Tailwind CSS v4, PostCSS, Vitest |
| **Backend** | Node.js (>= 22.13.0, ES Modules), Express 5, TypeScript (`tsx`, `tsc`), SQLite (`node:sqlite`), Jose (JWT), BcryptJS |
| **Tooling & Dev** | Concurrently, Angular CLI, Prettier |

---

<a name="structure-en"></a>
### Architecture & Project Structure

```text
bookky/
├── backend/
│   ├── data/                 # SQLite database storage (bookky.sqlite)
│   ├── src/
│   │   ├── routes/
│   │   │   └── SmartRouter.ts# Consolidated modular API route dispatcher
│   │   ├── auth.ts           # JWT session cookies, auth & role middleware
│   │   ├── auth.store.ts     # User credentials, hashing, SQLite queries
│   │   ├── booking.store.ts  # Tables, slots, conflict detection, auto-cleanup
│   │   ├── database.ts       # SQLite synchronization and table migrations
│   │   ├── menu.store.ts     # Menu items catalog and preorder sanitation
│   │   └── server.ts         # Express bootstrap and listener
│   ├── .env.example
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── core/         # Services (auth, booking), models, guards, utilities
│   │   │   ├── pages/
│   │   │   │   ├── account/  # Guest personal dashboard
│   │   │   │   ├── admin/    # Admin table inspector and bookings manager
│   │   │   │   ├── auth/     # Login and registration dialogs
│   │   │   │   ├── booking/  # 6-step reservation wizard & components
│   │   │   │   ├── home/     # Landing showcase page
│   │   │   │   └── menu/     # Restaurant digital menu catalog
│   │   │   └── app.routes.ts # Angular route definitions with role guards
│   │   ├── styles.css        # Tailwind v4 theme, tokens & utility classes
│   │   └── index.html
│   ├── package.json
│   └── tsconfig.json
├── package.json              # Monorepo concurrency scripts
└── README.md
```

---

<a name="prerequisites-en"></a>
### Prerequisites

- **Node.js**: `v22.13.0` or higher (uses built-in `node:sqlite`).
- **npm**: `v10.x` or higher.

---

<a name="getting-started-en"></a>
### Getting Started

#### 1. Clone & Install Dependencies
```bash
git clone <repository-url> bookky
cd bookky

# Install root dependencies
npm install

# Install backend dependencies
cd backend && npm install

# Install frontend dependencies
cd ../frontend && npm install
cd ..
```

#### 2. Configure Backend Environment
Create a `.env` file inside the `backend/` directory based on `backend/.env.example`:
```bash
cp backend/.env.example backend/.env
```

Edit `backend/.env`:
```env
JWT_SECRET=your_super_secret_jwt_key_at_least_32_chars
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=admin_strong_password_123
DATABASE_PATH=./data/bookky.sqlite
```

> **Tip:** You can generate a random secret with:
> ```bash
> openssl rand -base64 48
> ```

#### 3. Run the Development Server
From the project root:
```bash
npm run dev
```
- **Frontend:** [http://localhost:4200](http://localhost:4200)
- **Backend API:** [http://localhost:3000/api](http://localhost:3000/api)

---

<a name="api-en"></a>
### API Endpoints

All endpoints are organized within [`backend/src/routes/SmartRouter.ts`](backend/src/routes/SmartRouter.ts) and mounted under the `/api` prefix:

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Public | Register new guest account |
| `POST` | `/api/auth/login` | Public | Authenticate user / admin and set cookie |
| `GET` | `/api/auth/me` | Authenticated | Retrieve current session profile |
| `POST` | `/api/auth/logout` | Authenticated | Clear HTTP-only session cookie |
| `GET` | `/api/menu` | Public | Get full menu items list with prices & tags |
| `GET` | `/api/bookings/slots` | Public | Get time slots availability for given date (`?date=YYYY-MM-DD`) |
| `GET` | `/api/tables/availability` | Public | Get available tables for slot (`?date=...&time=...`) |
| `GET` | `/api/bookings/mine` | User | Get current user's active & upcoming bookings |
| `POST` | `/api/bookings` | User | Create a new table reservation with optional preorder |
| `PATCH` | `/api/bookings/:id/cancel`| User | Cancel a user's own booking |
| `GET` | `/api/admin/hall-status` | Admin | Get hall layout occupancy for date and time |
| `GET` | `/api/bookings` | Admin | Get all bookings across the restaurant |
| `PATCH` | `/api/bookings/:id/status`| Admin | Update booking status (`Pending` / `Confirmed` / `Cancelled`) |

---

<a name="database-en"></a>
### Database & Persistence

The project uses embedded **SQLite** via Node's native `node:sqlite` module without third-party binary driver dependencies.

- **Storage Location:** [`backend/data/bookky.sqlite`](backend/data/bookky.sqlite)
- **Automatic Purging:** Whenever user reservations are queried, bookings from past days (`date < today`) are automatically deleted from the database to prevent stale records from accumulating.
- **Inspect DB via CLI:**
  ```bash
  sqlite3 -box backend/data/bookky.sqlite "SELECT * FROM bookings;"
  ```

---

<a name="testing-en"></a>
### Testing & Quality Assurance

Frontend unit and integration tests are powered by Vitest:
```bash
# Run all frontend tests once
npm run test --prefix frontend -- --no-watch

# Run in watch mode during development
npm run test --prefix frontend

# Type-check and build backend
npm run build --prefix backend

# Build production bundle for frontend
npm run build --prefix frontend
```

---

<a name="русский"></a>
## Русский

BOOKKY — это современное веб-приложение для онлайн-бронирования столиков в ресторане и предварительного заказа блюд кухни. Проект оформлен в премиальной тёмной эстетике с золотыми акцентами, включает интерактивную схему залов, цифровое меню, личный кабинет гостя и панель управления для администраторов ресторана.

---

### Содержание
1. [Ключевые возможности](#features-ru)
2. [Стек технологий](#tech-stack-ru)
3. [Архитектура и структура проекта](#structure-ru)
4. [Системные требования](#prerequisites-ru)
5. [Установка и запуск](#getting-started-ru)
6. [Переменные окружения](#env-ru)
7. [API-эндпоинты](#api-ru)
8. [База данных](#database-ru)
9. [Тестирование и сборка](#testing-ru)

---

<a name="features-ru"></a>
### Ключевые возможности

* **Пошаговый мастер бронирования (6 шагов):**
  1. **Дата визита:** бронь на 14 дней вперёд, автоматический учёт выходного дня (понедельник), чипы быстрого выбора дня.
  2. **Время визита:** дневные и вечерние слоты с реальным счетчиком оставшихся столов и шагом визита в 2 часа.
  3. **Количество гостей:** счетчик от 1 до 12 гостей с рекомендацией банкетного зала для больших компаний.
  4. **Выбор столика в зале:** два режима — интерактивная графическая карта рассадки (столы и стулья по зонам) и компактный список-карточки для мобильных телефонов.
  5. **Предзаказ блюд:** удобный выбор блюд из меню (закуски, горячее, десерты, напитки), поиск по названию, карточки с фотографиями, весом и калориями, счетчик порций и расчет суммы.
  6. **Контактные данные:** маска телефона, валидация полей и финальное модальное окно с деталями подтверждения.
* **Адаптивность для смартфонов (Mobile-First):**
  - Закрепленная нижняя плашка сводки заказа с поддержкой безопасных зон экранов (`safe-area-inset-bottom`) и быстрым переходом к нужному шагу.
  - Размер шрифта полей ввода 16px (предотвращает нежелательный зум в Safari на iOS).
  - Плавный touch-скролл и переключение в режим списка столов.
* **Личный кабинет гостя:**
  - Просмотр актуальных и предстоящих визитов с детализацией предзаказанных блюд.
  - Автоматическая очистка и удаление просроченных броней из базы данных (прошедшие дни не отображаются).
  - Отмена бронирования в один клик.
* **Панель администратора:**
  - Интерактивный просмотр занятости зала по дате и времени.
  - Список всех броней с фильтрацией по статусам (`Ожидает`, `Подтверждена`, `Отменена`) и дате.
  - Изменение статуса бронирования с проверкой на конфликты занятости столиков.
* **Безопасность и авторизация:**
  - Ролевой доступ (`user`, `admin`).
  - Сессионные куки `HttpOnly`, `SameSite=Strict` с подписью JWT (срок действия токена 8 часов).
  - Хеширование паролей через `bcryptjs`.

---

<a name="tech-stack-ru"></a>
### Стек технологий

| Уровень | Технологии |
| :--- | :--- |
| **Фронтенд** | Angular 22 (Standalone-компоненты, Signals, Computed, Effects), TypeScript, Tailwind CSS v4, PostCSS, Vitest |
| **Бэкенд** | Node.js (>= 22.13.0, ES-модули), Express 5, TypeScript (`tsx`, `tsc`), SQLite (`node:sqlite`), Jose (JWT), BcryptJS |
| **Инфраструктура** | Concurrently, Angular CLI, Prettier |

---

<a name="structure-ru"></a>
### Архитектура и структура проекта

```text
bookky/
├── backend/
│   ├── data/                 # Хранилище базы данных SQLite (bookky.sqlite)
│   ├── src/
│   │   ├── routes/
│   │   │   └── SmartRouter.ts# Единый роутер со всеми API-эндпоинтами
│   │   ├── auth.ts           # Middleware авторизации, роли и сессионные куки
│   │   ├── auth.store.ts     # Работа с пользователями, хеширование паролей
│   │   ├── booking.store.ts  # Бизнес-логика броней, столы, слоты, автоочистка
│   │   ├── database.ts       # Инициализация SQLite и миграции таблиц
│   │   ├── menu.store.ts     # Каталог блюд меню и санитизация предзаказа
│   │   └── server.ts         # Точка входа Express-сервера
│   ├── .env.example
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── core/         # Сервисы (Auth, Booking), модели, гарды, утилиты
│   │   │   ├── pages/
│   │   │   │   ├── account/  # Личный кабинет гостя
│   │   │   │   ├── admin/    # Панель администратора ресторана
│   │   │   │   ├── auth/     # Вход и регистрация
│   │   │   │   ├── booking/  # 6 шагов онлайн-бронирования
│   │   │   │   ├── home/     # Главная промо-страница ресторана
│   │   │   │   └── menu/     # Страница полного меню кухни
│   │   │   └── app.routes.ts # Маршруты Angular с защитой доступа (Guards)
│   │   ├── styles.css        # Тема Tailwind v4, токены и утилиты
│   │   └── index.html
│   ├── package.json
│   └── tsconfig.json
├── package.json              # Корневые скрипты Concurrently
└── README.md
```

---

<a name="prerequisites-ru"></a>
### Системные требования

- **Node.js**: версия `22.13.0` или выше (требуется для встроенного модуля `node:sqlite`).
- **npm**: версия `10.x` или выше.

---

<a name="getting-started-ru"></a>
### Установка и запуск

#### 1. Клонирование репозитория и установка зависимостей
```bash
git clone <url-репозитория> bookky
cd bookky

# Установка корневых зависимостей
npm install

# Установка зависимостей бэкенда
cd backend && npm install

# Установка зависимостей фронтенда
cd ../frontend && npm install
cd ..
```

#### 2. Настройка переменных окружения
Скопируйте файл примера `.env.example` в `.env` внутри директории `backend/`:
```bash
cp backend/.env.example backend/.env
```

Заполните `backend/.env`:
```env
JWT_SECRET=super_secret_jwt_key_at_least_32_chars_long
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=admin_strong_password_123
DATABASE_PATH=./data/bookky.sqlite
```

> **Совет:** Быстро сгенерировать надёжный ключ можно командой:
> ```bash
> openssl rand -base64 48
> ```

#### 3. Запуск проекта для разработки
Из корня проекта выполните:
```bash
npm run dev
```
- **Клиентская часть (Frontend):** [http://localhost:4200](http://localhost:4200)
- **Сервер API (Backend):** [http://localhost:3000/api](http://localhost:3000/api)

---

<a name="api-ru"></a>
### API-эндпоинты

Все маршруты вынесены в модульный роутер [`backend/src/routes/SmartRouter.ts`](backend/src/routes/SmartRouter.ts) с базовым префиксом `/api`:

| Метод | Путь | Доступ | Назначение |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Публичный | Регистрация нового аккаунта гостя |
| `POST` | `/api/auth/login` | Публичный | Вход пользователя / администратора с установкой Cookie |
| `GET` | `/api/auth/me` | Авторизован | Получение профиля текущей сессии |
| `POST` | `/api/auth/logout` | Авторизован | Сброс сессионной куки |
| `GET` | `/api/menu` | Публичный | Получение списка всех блюд меню ресторана |
| `GET` | `/api/bookings/slots` | Публичный | Список доступных слотов времени на дату (`?date=YYYY-MM-DD`) |
| `GET` | `/api/tables/availability` | Публичный | Список свободных столов на слот (`?date=...&time=...`) |
| `GET` | `/api/bookings/mine` | Гость | Получение активных броней текущего гостя |
| `POST` | `/api/bookings` | Гость | Создание новой брони со столиком и предзаказом блюд |
| `PATCH` | `/api/bookings/:id/cancel`| Гость | Отмена собственной брони пользователем |
| `GET` | `/api/admin/hall-status` | Администратор| Занятость столов в зале на выбранную дату и время |
| `GET` | `/api/bookings` | Администратор| Просмотр всех бронирований ресторана |
| `PATCH` | `/api/bookings/:id/status`| Администратор| Смена статуса брони (`Pending` / `Confirmed` / `Cancelled`) |

---

<a name="database-ru"></a>
### База данных

В проекте используется встроенная СУБД **SQLite** через системный модуль Node.js `node:sqlite` (без сторонних бинарных зависимостей).

- **Файл базы данных:** [`backend/data/bookky.sqlite`](backend/data/bookky.sqlite)
- **Автоматическая очистка просроченных записей:** при получении списка броней система автоматически удаляет из базы бронирования с прошедшей датой (`date < today`), гарантируя актуальность данных.
- **Быстрый просмотр базы через терминал:**
  ```bash
  sqlite3 -box backend/data/bookky.sqlite "SELECT * FROM bookings;"
  ```

---

<a name="testing-ru"></a>
### Тестирование и сборка

Фронтенд покрыт модульными и интеграционными тестами с использованием Vitest:
```bash
# Однократный запуск всех тестов фронтенда
npm run test --prefix frontend -- --no-watch

# Запуск тестов в режиме наблюдения (watch)
npm run test --prefix frontend

# Проверка типов и компиляция бэкенда
npm run build --prefix backend

# Сборка оптимизированного бандла фронтенда
npm run build --prefix frontend
```

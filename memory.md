# Dastarkhan — Что сделано

## Стек
- **Frontend:** Next.js 14+ App Router, TypeScript, CSS Modules (zero Tailwind)
- **Backend:** NestJS, TypeORM, PostgreSQL 18, Redis (Memurai)
- **Шрифты:** Cormorant Garamond (заголовки) + Jost (текст)
- **Package manager:** npm

## Порты
- Frontend: `localhost:3002` (или следующий свободный)
- Backend: `localhost:3005`
- PostgreSQL: `localhost:5432`, БД: `dastarkhan`, user: `postgres`, pass: `1234`
- Redis (Memurai): `localhost:6379`

---

## Frontend (`apps/frontend`)

### Страницы
| Страница | Путь | Статус |
|----------|------|--------|
| Главная | `(public)/page.tsx` | ✅ Готово (моки) |
| Логин/Регистрация | `(auth)/login/page.tsx` | ✅ Готово + подключён к API |

### Компоненты
- `Navbar` — логотип, навигация, кнопки "Для ресторанов" + "Войти"
- `Footer` — 4 колонки, переключатель языка РУС/ҚАЗ/ENG
- `Button` — переиспользуемый компонент

### Логин (`/login`)
- Вкладка **"Я гость"**: OTP-флоу (телефон → код → имя → успех)
- Вкладка **"Я ресторан"** → **Войти**: email + пароль
- Вкладка **"Я ресторан"** → **Подключить ресторан**: 3-шаговая регистрация
- `?type=rest` в URL автоматически открывает вкладку ресторана

### Утилиты
- `src/lib/api.ts` — axios instance, автоподстановка JWT из localStorage
- `src/lib/auth.ts` — функции: `sendOtp`, `verifyOtp`, `updateClientName`, `loginOwner`, `registerRestaurant`

---

## Backend (`apps/backend`)

### Модули и эндпоинты
| Модуль | Эндпоинты |
|--------|-----------|
| Auth | `POST /api/auth/client/otp/send` |
| | `POST /api/auth/client/otp/verify` |
| | `PATCH /api/auth/client/profile` |
| | `POST /api/auth/login` |
| | `GET /api/auth/me` |
| | `POST /api/auth/restaurant/register` |
| Restaurants | `GET/POST /api/admin/restaurant` |
| | `PATCH /api/admin/restaurant/:id` |
| | `GET/POST /api/admin/restaurant/:id/photos` |
| | `DELETE /api/admin/restaurant/photos/:photoId` |
| Tables | `GET/POST /api/admin/tables` |
| | `PATCH/DELETE /api/admin/tables/:id` |
| Menu | `GET /api/admin/menu` |
| | `POST/PATCH/DELETE /api/admin/menu/categories` |
| | `POST/PATCH/DELETE /api/admin/menu/items` |

### Entities (таблицы в БД)
- `users` — владельцы, staff, super_admin
- `clients` — гости (OTP авторизация)
- `restaurants` — рестораны (статус pending/active/blocked)
- `restaurant_photos` — фото ресторанов
- `restaurant_users` — связь user ↔ restaurant
- `tables` — столики с координатами и формой
- `subscriptions` — тарифы (start/business/pro), trial 14 дней
- `menu_categories` — категории меню
- `menu_items` — блюда

### Auth логика
- Клиенты: OTP → код в консоль (`[OTP] +7... → 1234`) → JWT (30д)
- Владельцы: email + bcrypt → JWT (7д)
- Регистрация ресторана: создаёт User + Restaurant (status=pending) + Subscription (trial)

---

## Конфиги
- `apps/backend/.env` — DATABASE, REDIS, JWT, PORT=3005
- `apps/frontend/.env` — `NEXT_PUBLIC_API_URL=http://localhost:3005/api`
- `.gitignore` — node_modules, .env*, .next/, dist/, logs, OS файлы
- `architecture.md` — полная архитектура проекта
- `phase.md` — 5 фаз разработки

# Dastarkhan — Что сделано

## Стек
- **Frontend:** Next.js 14+ App Router, TypeScript, CSS Modules (zero Tailwind)
- **Backend:** NestJS, TypeORM, PostgreSQL, Redis (Memurai)
- **Шрифты:** Cormorant Garamond (заголовки) + Jost (текст)
- **Package manager:** npm

## Порты
- Frontend: `localhost:3000`
- Backend: `localhost:3005`
- PostgreSQL: `localhost:5432`, БД: `dastarkhan`, user: `postgres`, pass: `1234`
- Redis (Memurai): `localhost:6379`

## Запуск
```bash
cd apps/backend && npm run start:dev
cd apps/frontend && npm run dev
cd apps/backend && npm run seed   # тестовые данные
```

---

## Фаза 1 ✅ — Основа

### Frontend
- `/` — главная (моки)
- `/login` — OTP для гостей, email+pass для владельцев, 3-шаговая регистрация ресторана
- `?type=rest` → открывает вкладку ресторана
- `?redirect=URL` → после логина возвращает на нужную страницу

### Backend модули
- `AuthModule` — OTP, JWT, регистрация ресторана
- `RestaurantsModule` — CRUD ресторана, фото
- `TablesModule` — CRUD столиков
- `MenuModule` — категории + блюда

### Entities
- `users`, `clients`, `restaurants`, `restaurant_photos`, `restaurant_users`
- `tables`, `subscriptions`, `menu_categories`, `menu_items`

---

## Фаза 2 ✅ — Бронирование и каталог

### Frontend
- `/catalog` — список активных ресторанов, пагинация, фильтры
- `/[slug]` — страница ресторана: инфо, меню, интерактивный план зала SVG, бронирование
- `/booking` — 3-шаговый визард бронирования
- `/admin` — заглушка кабинета ресторана ("в разработке")
- `Navbar` — аватар с буквой имени когда залогинен, дропдаун (история + выход); "Войти" и "Для ресторанов" скрыты когда залогинен
- `Step2` бронирования — авто-заполнение имени/телефона из профиля; если не залогинен → редирект на `/login?redirect=/booking`

### Backend модули
- `CatalogModule` — `GET /api/catalog`, `GET /api/catalog/:slug/availability`
- `BookingsModule` — `POST /api/bookings` с SELECT FOR UPDATE (защита от race condition)
- `QueuesModule` — BullMQ: очереди send_reminder, end_reminder, review_request, operator_alert

### Socket.io
- Namespace `/bookings`, room `restaurantId:date`, event `table:status-changed`

### Entities
- `bookings`, `booking_tables`

### Seed
- `npm run seed` → ресторан "Думан" (slug: duman), owner привязан
- Логин владельца: `owner@test.com` / `password123`

---

## Фаза 3 ✅ — Уведомления и очереди

### NotificationsModule (`modules/notifications/`)
- `WhatsAppService` — mock (консоль), готов к Twilio
- `TelegramService` — mock (консоль), готов к Bot API
- 5 шаблонов: booking-confirmed, reminder, end-reminder, review-request, operator-alert
- Env: `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_WHATSAPP_FROM`, `TELEGRAM_BOT_TOKEN`

### BullMQ процессоры (`modules/queues/processors/`)
- `SendReminderProcessor` — за 1ч до брони → шаблон reminder
- `EndReminderProcessor` — за 15мин до конца → шаблон end-reminder
- `ReviewRequestProcessor` — через 30мин после конца → шаблон review-request
- `OperatorAlertProcessor` — немедленно → шаблон operator-alert

### WebhooksModule (`modules/webhooks/`)
- `POST /api/webhooks/twilio` — ответы клиента через WhatsApp
- `POST /api/webhooks/telegram` — ответы клиента через Telegram
- Обрабатывает: ДА / НЕТ / ОТМЕНА / ОСТАЮСЬ / НАС СТАЛО БОЛЬШЕ X
- При создании брони: сразу отправляет booking-confirmed + планирует review_request

---

## Конфиги
- `apps/backend/.env` — DATABASE, REDIS, JWT, PORT=3005, Twilio (пусто), Telegram (пусто)
- `apps/frontend/.env.local` — `NEXT_PUBLIC_API_URL=http://localhost:3005/api`
- `architecture.md` — полная архитектура
- `phase.md` — 5 фаз разработки
- `future.md` — что осталось

---

## Что дальше

**Фаза 4** — Кабинет ресторана (`/admin`): kanban броней, редактор столиков, меню, сотрудники, статистика

**Фаза 5** — AI-чат (Claude Haiku), отзывы, Google Places, QR-коды, SuperAdmin, подписки, личный кабинет клиента `/account`

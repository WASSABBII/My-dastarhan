# Architecture — Dastarkhan (RestoBook v2)

> Версия: 1.0 · Дата: 2026-04-05  
> Стек: NestJS (TypeScript) + Next.js 14+ (TypeScript) + PostgreSQL + Redis + BullMQ

---

## Структура папок

```
dastarhan/
├── apps/
│   ├── backend/src/
│   │   ├── main.ts / app.module.ts
│   │   ├── config/          app / database / redis
│   │   ├── database/        TypeORM + migrations/ + seeds/
│   │   ├── modules/
│   │   │   ├── auth/        OTP+JWT (clients); email+bcrypt+JWT (users)
│   │   │   │   ├── strategies/  jwt.strategy.ts, jwt-client.strategy.ts
│   │   │   │   └── guards/      jwt-auth, roles, client-auth
│   │   │   ├── users/       владельцы, staff, super_admin
│   │   │   ├── clients/     гости (phone + OTP)
│   │   │   ├── restaurants/ CRUD + catalog.controller (публичный)
│   │   │   ├── tables/      столики + availability.service
│   │   │   ├── bookings/    ядро + race-condition.service (SELECT FOR UPDATE)
│   │   │   │   └── bookings-admin.controller
│   │   │   ├── notifications/  whatsapp / telegram / otp + webhook.controller
│   │   │   │   └── scenarios/  confirmation, reminder, end-reminder, review-request
│   │   │   ├── queues/      reminder, end-reminder, review, waitlist, operator-alert
│   │   │   ├── menu/        categories + items
│   │   │   ├── reviews/     своя система + google-places.service
│   │   │   ├── waitlist/
│   │   │   ├── media/       Cloudinary upload
│   │   │   ├── ai-chat/     Claude Haiku + restaurant_knowledge
│   │   │   ├── subscriptions/ тарифы + feature gates
│   │   │   ├── qr/          QR PNG + PDF
│   │   │   ├── statistics/
│   │   │   └── super-admin/
│   │   ├── gateways/        bookings.gateway.ts (Socket.io broadcast)
│   │   └── common/          decorators / filters / interceptors / pipes
│   │
│   └── frontend/src/
│       ├── app/
│       │   ├── globals.css / layout.tsx
│       │   ├── (public)/
│       │   │   ├── page.tsx            /
│       │   │   ├── catalog/page.tsx    /catalog
│       │   │   ├── [slug]/page.tsx     /baraka
│       │   │   └── booking/page.tsx    /booking
│       │   ├── (auth)/
│       │   │   ├── login/page.tsx      /login
│       │   │   └── for-restaurants/page.tsx
│       │   ├── (client)/account/       /account + /account/settings
│       │   ├── (admin)/admin/          layout + dashboard + bookings/tables/menu/
│       │   │                           reviews/staff/knowledge/settings/statistics
│       │   ├── (superadmin)/superadmin/
│       │   └── (tokens)/cancel/[token]/ + review/[token]/
│       ├── components/
│       │   ├── ui/          Button, Input, Select, Modal, Badge, Spinner
│       │   ├── layout/      Navbar, Footer, AdminSidebar
│       │   ├── restaurant/  RestaurantHero, RestaurantTabs, BookingWidget, MenuTab,
│       │   │                ReviewsTab, AiChatTab
│       │   ├── floor-plan/  FloorPlan, TableShape, useFloorPlan
│       │   ├── booking/     BookingWizard, Step1-3, BookingSummary
│       │   ├── catalog/     RestaurantCard, CatalogFilters
│       │   └── admin/       BookingKanban (@dnd-kit), StatsCharts (Recharts),
│       │                    TableEditor, MediaUpload (react-dropzone)
│       ├── hooks/           useSocket, useAuth, useBookings, useAvailability
│       ├── lib/             api.ts (axios), socket.ts, utils.ts
│       ├── store/           auth.store.ts, booking.store.ts (Zustand)
│       └── types/           api.types.ts, booking.types.ts
│
├── packages/shared-types/index.ts
└── package.json             workspace root
```

---

## globals.css

Единственный глобальный CSS. Содержит: шрифты (Cormorant Garamond + Jost), CSS-переменные (`--primary`, `--bg`, `--card`, `--border`, `--text`, etc.), CSS reset, base body. Все компонентные стили — только в `[name].module.css`.

---

## Схема БД

```sql
users               id, email UNIQUE, password_hash, role(super_admin|owner|staff)
restaurant_groups   id, name, owner_id→users
restaurants         id, group_id, name, slug UNIQUE, description, address, cuisine_type,
                    phone, video_url, twilio_phone_number, operator_phone, place_id,
                    timezone, working_hours JSONB, buffer_minutes, deposit_required,
                    deposit_amount, status(pending|active|blocked)
restaurant_photos   id, restaurant_id, url, sort_order
restaurant_users    id, user_id, restaurant_id, role(owner|staff)  UNIQUE(user_id,restaurant_id)
subscriptions       id, restaurant_id UNIQUE, plan(start|business|pro),
                    status(trial|active|expired), trial_ends_at, paid_until
tables              id, restaurant_id, label, capacity, location_tag,
                    pos_x, pos_y, shape(round|square|rectangle), is_active
clients             id, phone UNIQUE, name, notification_channel(whatsapp|telegram), telegram_chat_id
bookings            id, restaurant_id, client_id, date, time_start, time_end,
                    estimated_duration, guests_count,
                    status(pending|confirmed|arrived|cancelled|no_show|extended),
                    created_by(client|staff), cancel_token UNIQUE, prepaid,
                    prepaid_amount, end_reminder_sent_at, reminder_sent_at,
                    reminder_response(yes|no)
                    INDEX: (restaurant_id, date, status), cancel_token
booking_tables      id, booking_id, table_id  UNIQUE(booking_id,table_id)
                    INDEX: (table_id, booking_id)
operator_alerts     id, restaurant_id, booking_id, type(no_response|late_cancel|no_show), resolved
restaurant_knowledge id, restaurant_id, category(faq|contacts|promo), title, content
reviews             id, restaurant_id, booking_id, client_id, source(internal|google),
                    rating 1-5, text, author_name, review_token UNIQUE, owner_reply
waitlist            id, restaurant_id, client_phone, date, time, guests_count,
                    notified_at, booking_token UNIQUE
menu_categories     id, restaurant_id, name, sort_order, is_active
menu_items          id, category_id, restaurant_id, name, description, price,
                    photo_url, allergens JSONB, is_available
```

---

## API контракт

Формат ответа: `{ "data": ..., "meta": { "page": 1, "total": 100 } }`  
Ошибка: `{ "statusCode": 409, "message": "...", "error": "Conflict" }`

### Auth
```
POST /api/auth/client/otp/send    { phone }
POST /api/auth/client/otp/verify  { phone, code } → { accessToken, client }
POST /api/auth/client/profile     { name }
POST /api/auth/login              { email, password } → { accessToken, user }
POST /api/auth/logout
GET  /api/auth/me
```

### Каталог (публичный)
```
GET  /api/catalog                          ?date&time&guests&cuisine&district&page
GET  /api/catalog/:slug
GET  /api/catalog/:slug/availability       ?date&time → { tables: [{ id, label, status }] }
GET  /api/catalog/:slug/menu
GET  /api/catalog/:slug/reviews            ?page
POST /api/catalog/:slug/chat               { message, history[] }
```

### Бронирования (клиент)
```
POST   /api/bookings                { restaurantId, tableId[], date, timeStart, estimatedDuration, guestsCount }
GET    /api/bookings/my
DELETE /api/bookings/:id/cancel
GET    /api/bookings/cancel/:token
POST   /api/bookings/cancel/:token
GET    /api/bookings/quick/:token
POST   /api/bookings/quick/:token
```

### Admin (owner/staff)
```
GET/POST/PATCH /api/admin/bookings
POST           /api/admin/bookings/:id/delay
GET/PATCH      /api/admin/restaurant
POST/DELETE    /api/admin/restaurant/photos
PATCH          /api/admin/restaurant/hours
GET/POST/PATCH/DELETE /api/admin/tables
GET/POST/PATCH/DELETE /api/admin/menu/categories
GET/POST/PATCH/DELETE /api/admin/menu/items
POST           /api/admin/menu/items/:id/photo
GET/POST/PATCH/DELETE /api/admin/knowledge
GET/POST/DELETE /api/admin/staff/invite
GET            /api/admin/reviews
POST           /api/admin/reviews/:id/reply
GET            /api/admin/qr/download
GET            /api/admin/qr/:tableId
GET            /api/admin/statistics    ?from&to
```

### Остальное
```
POST /api/media/upload             multipart { file, type }
DELETE /api/media/:publicId
POST /api/waitlist                 { restaurantId, phone, date, time, guestsCount }
GET/POST /api/reviews/:token
GET/PATCH /api/client/profile
POST /api/webhooks/twilio
POST /api/webhooks/telegram
GET  /api/superadmin/restaurants   ?status&page
PATCH /api/superadmin/restaurants/:id  { status }
GET  /api/superadmin/statistics
GET/PATCH /api/superadmin/subscriptions/:id
```

---

## WebSocket (Socket.io)

```
Namespace: /bookings
Event:     table:status-changed
Payload:   { restaurantId, tableId, date, time, status: 'free'|'busy' }
Комната:   restaurantId:date  (клиент подписывается, сервер бродкастит)
```

---

## Зоны агентов

| Агент | Зона |
|-------|------|
| `db-agent` | Миграции TypeORM, entities, seeds |
| `auth-agent` | Auth module: OTP, JWT, guards, strategies |
| `restaurant-agent` | restaurants, tables, media, menu |
| `booking-agent` | bookings, availability, race-condition, socket gateway |
| `notification-agent` | notifications, queues, webhooks, BullMQ processors |
| `admin-frontend-agent` | (admin) route group |
| `public-frontend-agent` | (public) главная, каталог, ресторан, бронирование |
| `integration-agent` | AI-chat, Google Places, QR/PDF, subscriptions |
| `superadmin-agent` | SuperAdmin модуль + страница |

---

## Переменные окружения (backend)

```env
DATABASE_URL=postgresql://user:pass@localhost:5432/dastarkhan
REDIS_URL=redis://localhost:6379
JWT_SECRET=              JWT_EXPIRES_IN=7d
JWT_CLIENT_SECRET=       JWT_CLIENT_EXPIRES_IN=30d
TWILIO_ACCOUNT_SID=      TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=     TWILIO_WHATSAPP_FROM=whatsapp:+14155238886
TELEGRAM_BOT_TOKEN=
CLOUDINARY_CLOUD_NAME=   CLOUDINARY_API_KEY=    CLOUDINARY_API_SECRET=
ANTHROPIC_API_KEY=
GOOGLE_PLACES_API_KEY=
APP_URL=https://dastarkhan.kz    PORT=3001    NODE_ENV=development
```

---

## Технические решения

| Задача | Решение |
|--------|---------|
| Защита от гонки | `SELECT FOR UPDATE` в транзакции TypeORM |
| Realtime план зала | Socket.io, комнаты по `restaurantId:date` |
| Отложенные уведомления | BullMQ delayed jobs |
| Кэш Google Places | Redis TTL 24h, ключ `google:places:{place_id}` |
| OTP | Redis TTL 5m, ключ `otp:{phone}` |
| Waitlist токен | Redis TTL 15m |
| Медиа | Cloudinary SDK, прямая загрузка с backend |
| PDF QR | pdfkit + qrcode, стриминг в ответ |
| Мультиселект столиков | `booking_tables` (1 бронь → N столиков) |
| Feature gates | Guard `SubscriptionGuard`, проверка `subscriptions.plan` |

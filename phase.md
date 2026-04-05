# Фазы разработки — Dastarkhan

---

### Фаза 1 — Фундамент (БД + Auth + Рестораны)

**Входит:**
- Все TypeORM entity + миграции (все таблицы из схемы)
- Monorepo структура (apps/backend + apps/frontend)
- Auth модуль: OTP через Twilio SMS + JWT для clients; email+bcrypt+JWT для users
- CRUD ресторанов (создание, редактирование, настройка)
- CRUD столиков (план зала — форма с координатами)
- Загрузка медиа (Cloudinary: фото ресторана, видео, фото блюд)
- CRUD меню (категории + блюда)
- Frontend: globals.css, Navbar, Footer, страница `/login` (login.html дизайн)

**Эндпоинты:**
```
POST /api/auth/client/otp/send
POST /api/auth/client/otp/verify
POST /api/auth/login
GET  /api/auth/me
GET/PATCH /api/admin/restaurant
POST/DELETE /api/admin/restaurant/photos
GET/POST/PATCH/DELETE /api/admin/tables
GET/POST/PATCH/DELETE /api/admin/menu/categories
GET/POST/PATCH/DELETE /api/admin/menu/items
POST /api/media/upload
```

**Зависимости:** нет, стартуем отсюда.

**Готово когда:**
- Можно зарегистрироваться (OTP) и войти как клиент и как owner
- Owner создаёт ресторан, загружает фото, добавляет столики с координатами и меню
- Все миграции применяются чисто, entities связаны

---

### Фаза 2 — Ядро бронирования (главная фича)

**Входит:**
- Проверка доступности столиков (`availability.service.ts`)
- Бронирование с защитой от гонки (`SELECT FOR UPDATE` в транзакции)
- Socket.io gateway: broadcast `table:status-changed`
- BullMQ: планирование задач `send_reminder` и `end_reminder`
- Frontend: страница ресторана `/[slug]` (restaurant.html дизайн)
  - Вкладки: О ресторане / Меню / Бронирование (с интерактивным планом зала SVG) / Отзывы
  - Компонент `FloorPlan` с realtime обновлением через Socket.io
- Frontend: мастер бронирования `/booking` (booking.html дизайн, 3 шага)
- Frontend: главная страница `/` (index.html дизайн)
- Frontend: каталог `/catalog` (список + поиск + фильтры)
- Отмена брони (по токену + авторизованная)

**Эндпоинты:**
```
GET  /api/catalog
GET  /api/catalog/:slug
GET  /api/catalog/:slug/availability
GET  /api/catalog/:slug/menu
POST /api/bookings
GET  /api/bookings/my
POST /api/bookings/cancel/:token
GET  /api/bookings/cancel/:token
DELETE /api/bookings/:id/cancel
```

**Зависимости:** Фаза 1 полностью завершена.

**Готово когда:**
- Клиент видит план зала, кликает на свободный столик, оформляет бронь
- При одновременном бронировании одного столика — один получает 409
- После создания брони — столик сразу помечается занятым на всех открытых вкладках (Socket.io)
- Клиент может отменить бронь по ссылке из подтверждения

---

### Фаза 3 — Уведомления и очереди

**Входит:**
- Twilio WhatsApp: все 6 сценариев уведомлений
- Telegram бот (Telegraf.js): те же сценарии
- Webhook контроллер: обработка ответов ДА/НЕТ/ОТМЕНА
- BullMQ processors: `reminder`, `end-reminder`, `review-request`, `operator-alert`
- Сценарий "Нас стало больше": поиск свободного стола, автобронь или waitlist
- Сценарий "Остаюсь": проверка следующих броней, продление или запрос хостесу
- Waitlist: POST /api/waitlist + быстрая бронь по токену (15 мин)
- Operator alerts модуль

**Эндпоинты:**
```
POST /api/webhooks/twilio
POST /api/webhooks/telegram
POST /api/waitlist
GET  /api/bookings/quick/:token
POST /api/bookings/quick/:token
```

**Зависимости:** Фаза 2 (bookings созданы, есть статусы).

**Готово когда:**
- За 1 час до визита клиент получает напоминание в WhatsApp/Telegram
- Ответы ДА/НЕТ/ОТМЕНА обрабатываются корректно
- За 15 мин до конца брони приходит уведомление с кнопками
- При отмене — занятый стол из waitlist получает уведомление с токеном

---

### Фаза 4 — Админ-панель ресторана

**Входит:**
- Frontend: весь (admin) route group (admin.html дизайн)
  - Дашборд с метриками
  - Список броней с фильтрами по статусу + ручная смена статуса
  - Ручное создание брони (мультиселект столиков — корпоратив)
  - Кнопка "Задержался" → уведомление следующему гостю
  - Страница управления меню
  - Страница плана зала (редактор столиков)
  - Управление сотрудниками (invite по email)
  - Настройки ресторана (часы работы, буфер, уведомления)
  - Просмотр отзывов + ответы владельца
- Backend: admin bookings endpoints, staff management, restaurant settings
- Сеть ресторанов: дропдаун переключения + общая аналитика

**Эндпоинты:**
```
GET/POST/PATCH /api/admin/bookings
POST /api/admin/bookings/:id/delay
GET/POST/DELETE /api/admin/staff/invite
GET/PATCH /api/admin/restaurant/hours
GET /api/admin/reviews
POST /api/admin/reviews/:id/reply
```

**Зависимости:** Фазы 1-3.

**Готово когда:**
- Owner/staff полностью управляет бронями в реальном времени
- Владелец настраивает ресторан, часы, сотрудников
- Хостес может нажать "Задержался" и клиент получит уведомление

---

### Фаза 5 — Интеграции и дополнительные фичи

**Входит:**
- AI-чат: Claude Haiku + база знаний (страница /admin/knowledge)
  - Вкладка AI-чат на странице ресторана
- Отзывы: своя система (форма по токену /review/:token)
- Отзывы: Google Places (кэш Redis, обновление раз в сутки)
- QR-коды: генерация PNG + PDF для всех столиков
- Статистика: графики (Recharts) — загруженность, no-show, популярные столики
- SuperAdmin панель: /superadmin (одобрение ресторанов, управление тарифами)
- Подписки + feature gates (тариф start/business/pro)
- Frontend: /account личный кабинет клиента (история броней, настройки)
- Frontend: /for-restaurants лендинг для ресторанов

**Эндпоинты:**
```
POST /api/catalog/:slug/chat
GET/POST /api/reviews/:token
GET /api/admin/knowledge (CRUD)
GET /api/admin/qr/download
GET /api/admin/statistics
GET /api/superadmin/restaurants
PATCH /api/superadmin/restaurants/:id
GET /api/superadmin/statistics
GET/PATCH /api/client/profile
```

**Зависимости:** Фазы 1-4.

**Готово когда:**
- Клиент может спросить у AI-чата про меню и получить ответ за ~1 сек
- После визита приходит запрос отзыва, клиент оставляет оценку
- QR скачивается PDF с кодами для всех столиков
- SuperAdmin одобряет новый ресторан из своей панели
- Статистика отображает реальные данные по бронированиям

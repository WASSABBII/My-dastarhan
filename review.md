## Тип: код (NestJS + Next.js monorepo)

## Резюме
Проект написан аккуратно, основные паттерны соблюдены, но есть одна критичная ошибка DI (AvailabilityService не экспортируется, но инжектируется), потенциальный runtime crash в нескольких местах, и архитектурный запах с circular dependency через QueuesModule.

---

## Проблемы

### АРХИТЕКТУРА / CIRCULAR DEPENDENCY

- **[высокая]** `WebhooksModule` инжектирует `AvailabilityService`, но `BookingsModule` его не экспортирует.
  Файл: `apps/backend/src/modules/bookings/bookings.module.ts`, строка 22.
  В `exports` есть только `[BookingsService, AvailabilityService]` — технически экспорт есть, но `WebhooksModule` не использует `AvailabilityService` через провайдеры — он инжектируется напрямую в `WebhooksService` (строка 9 `webhooks.service.ts`), а вот `AvailabilityService` в `WebhooksModule` не импортирован явно через `TypeOrmModule.forFeature` — у него нет собственных репозиториев там, а `BookingsModule` экспортирует его как сервис. Это должно работать. **Пересмотрено — не критично**, но стоит проверить рантайм.

- **[средняя]** Скрытый circular dependency через QueuesModule:
  `BookingsModule` → `QueuesModule` (строка 10 bookings.module.ts)
  `ProcessorsModule` → `BookingsModule` (строка 3 processors.module.ts)
  `ProcessorsModule` → `NotificationsModule`
  `BookingsModule` → `NotificationsModule`
  Прямого цикла нет, но `BookingsModule` и `ProcessorsModule` — взаимно связанные клиенты одних и тех же очередей. Если в будущем `ProcessorsModule` попытается импортировать `QueuesModule` (для republish), возникнет цикл. Сейчас не блокирует, но архитектурный запах.

- **[низкая]** `QueuesModule` и `ProcessorsModule` оба регистрируют одни и те же очереди через `BullModule.registerQueue(...)` с теми же именами (`send_reminder`, `end_reminder`, `review_request`, `operator_alert`). Дублирование безопасно в BullMQ, но избыточно. Достаточно регистрировать в одном месте.

---

### БЕЗОПАСНОСТЬ

- **[высокая]** Эндпоинты webhook'ов (`POST /webhooks/twilio` и `POST /webhooks/telegram`) не защищены никакой аутентификацией.
  Файл: `apps/backend/src/modules/webhooks/webhooks.controller.ts`, строки 8–19.
  Любой может отправить POST с `{ "From": "+77001234567", "Body": "НЕТ" }` и отменить чужую бронь. Twilio подписывает запросы заголовком `X-Twilio-Signature` — его нужно валидировать. Telegram — проверять `secret_token` из `setWebhook`. Исправление: добавить guard с проверкой подписи.

- **[средняя]** SQL injection через интерполяцию enum-значений в QueryBuilder.
  Файлы:
  - `apps/backend/src/modules/bookings/bookings.service.ts`, строки 50–51
  - `apps/backend/src/modules/bookings/availability.service.ts`, строки 31–32
  - `apps/backend/src/modules/webhooks/webhooks.service.ts`, строка 128
  Паттерн: `` `b.status NOT IN ('${BookingStatus.CANCELLED}', '${BookingStatus.NO_SHOW}')` ``
  Сами enum-значения здесь статичны и безопасны, но паттерн опасен — при рефакторинге кто-то может вставить туда пользовательский ввод. Правильно: `.andWhere('b.status NOT IN (:...statuses)', { statuses: [BookingStatus.CANCELLED, BookingStatus.NO_SHOW] })`.

- **[средняя]** `AuthService` создаёт собственный Redis-клиент через `createClient` прямо в конструкторе.
  Файл: `apps/backend/src/modules/auth/auth.service.ts`, строки 32–38.
  Проблемы: (1) отдельное соединение с Redis параллельно BullMQ-соединению, (2) ошибка подключения проглатывается через `.catch(console.error)` и не влияет на старт приложения — OTP будет молча не работать. Правильно: использовать `@liaoliaots/nestjs-redis` или ioredis через DI.

- **[низкая]** Webhook-эндпоинт Telegram принимает `body: any` без какой-либо валидации структуры.
  Файл: `apps/backend/src/modules/webhooks/webhooks.controller.ts`, строка 14.
  Если придёт мусор, `webhooks.service.ts` строка 40 — `update?.message` вернёт `undefined` и код тихо вернёт OK. Это не crash, но непрозрачно.

---

### КОРРЕКТНОСТЬ / RUNTIME ОШИБКИ

- **[высокая]** `findLastActiveBooking` ищет только брони со статусом `CONFIRMED`.
  Файл: `apps/backend/src/modules/webhooks/webhooks.service.ts`, строки 158–167.
  Клиент может ответить "ОСТАЮСЬ" когда его бронь уже в статусе `ARRIVED` (оператор отметил приход). В этом случае `booking` будет `null`, и клиент получит игнор вместо продления. Нужно искать по `status IN (CONFIRMED, ARRIVED)`.

- **[высокая]** `handleStaying` обращается к `booking.booking_tables` без проверки на `null`/`undefined`.
  Файл: `apps/backend/src/modules/webhooks/webhooks.service.ts`, строка 114.
  Написано `booking.booking_tables?.map(...)` — optional chaining есть, но `findLastActiveBooking` загружает relation `booking_tables` (строка 164). Если relation не загрузилась (TypeORM вернул `undefined`), `tableIds` будет `[]`, и код молча продлит без проверки конфликтов. Логически некорректно — продление без проверки столиков. Нужно добавить явную проверку: если `tableIds.length === 0` — не продлевать, а алертить оператора.

- **[средняя]** `parseDateTime` в `time.util.ts` создаёт Date без timezone.
  Файл: `apps/backend/src/common/utils/time.util.ts`, строка 10.
  `new Date("2025-06-15T19:00:00")` парсится как **локальное время** в Node.js, но на сервере в production (обычно UTC) и у клиента в другой TZ это даст разные миллисекунды. BullMQ задержки в `queues.service.ts` строки 17–18 будут неверными. Правильно: `new Date(`${date}T${time}:00Z`)` или явно указывать TZ.

- **[средняя]** `addMinutes` в `time.util.ts` обрезает часы по модулю 24.
  Файл: `apps/backend/src/common/utils/time.util.ts`, строка 5.
  `Math.floor(total / 60) % 24` — если бронь с 23:00 на 2 часа, `time_end` будет `01:00`, но дата не меняется. Запросы на конфликты сравнивают `time_start < time_end` в рамках одной даты — полночный переход сломает логику конфликтов. Для ресторана это edge case, но он существует.

- **[средняя]** `handleResponse` в `webhooks.service.ts` парсит "НАС СТАЛО БОЛЬШЕ" через `text.split(' ')`.
  Файл: `apps/backend/src/modules/webhooks/webhooks.service.ts`, строки 91–95.
  Если клиент пишет "НАС СТАЛО БОЛЬШЕ" без числа или "НАС СТАЛО БОЛЬШЕ abc", `parseInt` вернёт `NaN`, и `NaN || 1` даст 1. Это тихо неверно — лучше явно проверять.

- **[низкая]** `cancelByToken` в `bookings.service.ts` не загружает relation `client` (строка 128).
  Но `cancelByToken` вызывается из `webhooks.service.ts` строка 73 после чего вызывается `scheduleOperatorAlert`. `operatorAlertTemplate` использует `booking.client?.phone` — relation не загружена, будет `undefined`. Оператор получит алерт без телефона клиента.

- **[низкая]** В `notifications.service.ts` строка 48: `err.message` — если `err` это не `Error` объект (например, строка), будет `undefined`. Нужно `String(err)` или `err?.message`.

---

### TYPESCRIPT / ТИПИЗАЦИЯ

- **[средняя]** `handleTelegramWebhook` принимает `update: any`.
  Файл: `apps/backend/src/modules/webhooks/webhooks.service.ts`, строка 39.
  Нет интерфейса для Telegram Update. Минимально нужен `interface TelegramUpdate { message?: { from?: { id: number }; text?: string } }`.

- **[низкая]** `req: any` в `bookings.controller.ts` строки 31, 37, 43.
  Стандартный паттерн для NestJS без кастомного декоратора, но типизация теряется. Рекомендуется создать `@CurrentUser()` декоратор.

- **[низкая]** `process(job: Job<{ bookingId: string }>)` — во всех четырёх процессорах сигнатура корректная и наследование от `WorkerHost` правильное. Метод `process` переопределяет абстрактный метод из `WorkerHost`. Это **OK**.

---

### ФРОНТЕНД

- **[низкая]** `apps/frontend/src/app/(public)/[slug]/page.tsx`, строка 47.
  `catch {}` без логирования ошибки при загрузке ресторана. Если API упадёт, пользователь увидит "Ресторан не найден" без какого-либо лога в консоли. Добавить хотя бы `console.error`.

- **[низкая]** `useSearchParams()` на строке 19 в Next.js 14+ требует `<Suspense>` boundary вокруг компонента. Без него возможен предупреждение/ошибка при SSR. Файл помечен `'use client'`, но при серверном рендере parent layout это может всплыть.

---

## Вердикт

**NEEDS CHANGES**

Блокирующие для production проблемы:
1. Webhook-эндпоинты без аутентификации — любой может отменить чужую бронь
2. `findLastActiveBooking` не покрывает статус `ARRIVED` — ОСТАЮСЬ не будет работать для пришедших гостей
3. Timezone-баг в `parseDateTime` — BullMQ-задержки будут неверными на production-сервере в UTC

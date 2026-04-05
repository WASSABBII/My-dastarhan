# RestoBook — Безопасность

> Документ создан: 2026-04-01

---

## 1. Аутентификация и токены

### Клиент (гость ресторана)
```
1. Вводит номер телефона
2. Получает OTP-код (6 цифр) по SMS через Twilio
3. Код живёт 5 минут в Redis, после — удаляется
4. После верификации → выдаётся JWT access token (15 мин)
                      + refresh token (30 дней) в httpOnly cookie
```

### Админ ресторана
```
- Email + пароль → хранится bcrypt hash (cost factor 12)
- Пароль никогда не хранится в открытом виде
- Та же JWT схема: access (15 мин) + refresh (30 дней)
- При смене пароля → все refresh токены инвалидируются
```

### JWT
```
- Подписывается RS256 (асимметричный алгоритм)
- Приватный ключ — только на бэкенде
- Payload: { sub: userId, role, restaurantId, iat, exp }
- httpOnly cookie — JavaScript на фронтенде не может прочитать токен
```

---

## 2. Авторизация (RBAC)

Каждый запрос к API проходит два уровня проверки:

### Уровень 1 — роль
```
super_admin → полный доступ к платформе
owner       → только свои рестораны
staff       → только брони своего ресторана (без настроек)
client      → только свои брони и публичные данные
```

### Уровень 2 — владение ресурсом
```
Пример: GET /restaurants/baraka/bookings
→ декодируем JWT → user.id
→ проверяем: restaurant_users WHERE user_id = ? AND restaurant_id = baraka.id
→ если нет записи → 403 Forbidden
```

### PostgreSQL Row Level Security
```sql
-- Дополнительный слой: даже если баг в коде,
-- БД сама не отдаст чужие данные

ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY bookings_owner_policy ON bookings
  USING (restaurant_id IN (
    SELECT restaurant_id FROM restaurant_users
    WHERE user_id = current_setting('app.current_user_id')::uuid
  ));
```

---

## 3. Защита API

### Rate Limiting (NestJS Throttler)

| Endpoint | Лимит | Окно |
|----------|-------|------|
| POST /auth/otp | 3 запроса | 1 час на номер |
| POST /auth/login | 5 попыток | 15 мин на IP |
| POST /bookings | 10 запросов | 1 мин на IP |
| POST /chat/:slug | 100 вопросов | 1 день на ресторан |
| Все остальные | 100 запросов | 1 мин на IP |

При превышении → 429 Too Many Requests.

### Валидация входных данных
```
- class-validator на каждом DTO (NestJS)
- Whitelist: лишние поля автоматически отбрасываются
- Типизация TypeScript — неожиданные типы не проходят
- Максимальная длина строк, допустимые значения enum
```

### SQL инъекции
```
- TypeORM использует parameterized queries везде
- Никогда не конкатенируем строки в SQL запросах
- Raw queries — только через параметры: query('SELECT $1', [value])
```

### HTTP заголовки (Helmet.js)
```
Content-Security-Policy    → запрещает загрузку ресурсов с чужих доменов
X-Frame-Options: DENY      → защита от clickjacking
X-Content-Type-Options     → браузер не угадывает тип файла
Strict-Transport-Security  → только HTTPS
```

### CORS
```
Разрешённые origins:
- https://restobook.kz
- https://www.restobook.kz

Все остальные домены → 403
```

---

## 4. Защита базы данных

```
Доступ:
- PostgreSQL на Railway закрыт от публичного интернета
- Соединение только с бэкенда через SSL (sslmode=require)
- Отдельный DB пользователь с минимальными правами
  (SELECT, INSERT, UPDATE, DELETE — без DROP, ALTER, SUPERUSER)

Бэкапы:
- Railway автоматический бэкап каждые 24 часа
- Retention: 7 дней

Секреты:
- DATABASE_URL только в Railway Environment Variables
- Никогда не попадает в git, логи, код
```

---

## 5. Персональные данные

Соответствие **Закону РК "О персональных данных и их защите"** (2013, с поправками 2024).

### Что шифруем
```
- Номера телефонов клиентов → AES-256-GCM в БД
- Расшифровка только при необходимости отправить уведомление
- Логи не содержат телефоны и имена (маскируем: +7 777 ***-**-67)
```

### Права пользователя
```
- Право на доступ к своим данным (GET /clients/me)
- Право на исправление (PATCH /clients/me)
- Право на удаление — кнопка "Удалить аккаунт":
  → удаляет личные данные
  → брони анонимизируются (client_id = null)
  → данные удаляются в течение 30 дней
```

### Хранение данных
```
- Данные клиентов: хранятся пока аккаунт активен + 1 год
- Брони: хранятся 3 года (для аналитики ресторана)
- Логи: 90 дней, без PII
- OTP коды: 5 минут (Redis TTL)
```

### Обязательные документы на сайте
```
- Политика конфиденциальности
- Пользовательское соглашение
- Cookie policy
- Согласие на обработку ПД при регистрации (чекбокс)
```

---

## 6. Загрузка файлов

```
Проверки до отправки в Cloudinary:
1. MIME-тип файла (не только расширение)
   - Фото: image/jpeg, image/png
   - Видео: video/mp4
2. Размер файла:
   - Фото ресторана: макс 5 МБ
   - Видео: макс 50 МБ
   - Фото блюда: макс 2 МБ
3. Загруженные файлы никогда не исполняются
4. Cloudinary автоматически сканирует файлы

Имена файлов:
- Генерируем UUID для имени файла в Cloudinary
- Оригинальное имя файла от пользователя не используется
```

---

## 7. Webhook безопасность

### Twilio (WhatsApp + SMS)
```typescript
// Каждый входящий запрос от Twilio подписан HMAC-SHA1
// NestJS middleware проверяет подпись:

import { validateRequest } from 'twilio';

const isValid = validateRequest(
  process.env.TWILIO_AUTH_TOKEN,
  twilioSignature,       // из заголовка X-Twilio-Signature
  requestUrl,
  requestBody
);

if (!isValid) throw new ForbiddenException();
```

### Telegram
```
Webhook URL: /telegram/webhook/{TELEGRAM_SECRET_TOKEN}

- Токен генерируется при запуске (crypto.randomBytes(32))
- Хранится в .env
- Запросы без токена → игнорируются
```

---

## 8. Одноразовые токены (ссылки)

| Токен | Назначение | Генерация | TTL |
|-------|-----------|-----------|-----|
| `cancel_token` | Ссылка отмены брони | UUID v4 | 24 часа |
| `review_token` | Ссылка для отзыва | UUID v4 | 7 дней |
| `booking_token` | Быстрая бронь из waitlist | UUID v4 | 15 минут |
| OTP код | Верификация телефона | 6 цифр random | 5 минут |

Все TTL хранятся в Redis. После использования — удаляются немедленно (одноразовые).

---

## 9. Секреты и конфигурация

```
Никогда в коде или git:
- DATABASE_URL
- JWT_PRIVATE_KEY
- TWILIO_AUTH_TOKEN
- ANTHROPIC_API_KEY
- CLOUDINARY_API_SECRET
- TELEGRAM_SECRET_TOKEN

Где хранятся:
- Локально: .env файл (в .gitignore)
- Продакшн: Railway Environment Variables (зашифровано)

.env.example в репозитории — только названия переменных без значений
```

---

## 10. Мониторинг и реагирование

```
Что логируем (без PII):
- Все 4xx и 5xx ошибки
- Превышение rate limit (IP, endpoint)
- Неудачные попытки входа
- Невалидные токены

Алерты (Railway + email):
- Сервер упал
- БД недоступна
- Ошибок > 50 за 5 минут

При подозрительной активности:
- Автоблокировка IP на 1 час (после 20 failed attempts)
- Уведомление на email super_admin
```

---

## Итого — защита по слоям

```
Интернет
    ↓
[HTTPS / SSL]              ← Railway + Vercel автоматически
    ↓
[Helmet.js + CORS]         ← только restobook.kz
    ↓
[Rate Limiting]            ← защита от брутфорса и DDoS
    ↓
[JWT + RBAC]               ← кто ты и что тебе можно
    ↓
[Валидация DTO]            ← только ожидаемые данные
    ↓
[TypeORM parameterized]    ← SQL инъекции невозможны
    ↓
[Row Level Security]       ← БД сама не отдаст чужое
    ↓
[AES-256 шифрование]       ← телефоны зашифрованы
    ↓
PostgreSQL
```

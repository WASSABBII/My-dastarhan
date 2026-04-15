import Link from 'next/link'
import styles from './page.module.css'

const PLANS = [
  {
    name: 'Start',
    price: 'Бесплатно',
    period: '14 дней пробный',
    features: [
      'До 10 столиков',
      'Онлайн-бронирование',
      'Базовые уведомления (WhatsApp)',
      'Управление меню',
      'Простая аналитика',
    ],
    highlight: false,
    cta: 'Начать бесплатно',
  },
  {
    name: 'Business',
    price: '15 000 ₸',
    period: 'в месяц',
    features: [
      'До 30 столиков',
      'Всё из Start',
      'Уведомления Telegram',
      'Расширенная статистика',
      'Система отзывов',
      'Управление персоналом',
    ],
    highlight: true,
    cta: 'Выбрать Business',
  },
  {
    name: 'Pro',
    price: '35 000 ₸',
    period: 'в месяц',
    features: [
      'Без ограничений',
      'Всё из Business',
      'AI-консьерж для гостей',
      'Интеграция Google Reviews',
      'Лист ожидания',
      'Приоритетная поддержка',
    ],
    highlight: false,
    cta: 'Выбрать Pro',
  },
]

const FEATURES = [
  {
    icon: '📅',
    title: 'Онлайн-бронирование 24/7',
    desc: 'Гости бронируют столик прямо с вашей страницы, без звонков. Вы получаете уведомление мгновенно.',
  },
  {
    icon: '🏛️',
    title: 'Интерактивный план зала',
    desc: 'Визуальный редактор расстановки столиков. Гость видит свободные места в реальном времени.',
  },
  {
    icon: '📲',
    title: 'Умные уведомления',
    desc: 'Автоматические напоминания через WhatsApp и Telegram. Подтверждение, напоминание, отзыв.',
  },
  {
    icon: '🤖',
    title: 'AI-консьерж',
    desc: 'Чат-бот на базе Claude отвечает на вопросы гостей о меню, ценах и бронировании 24/7.',
  },
  {
    icon: '📊',
    title: 'Аналитика и статистика',
    desc: 'Загруженность по дням, часам и столикам. Процент no-show, конверсия броней.',
  },
  {
    icon: '⭐',
    title: 'Управление отзывами',
    desc: 'Автоматический сбор отзывов после визита. Ответы владельца, интеграция с Google.',
  },
]

export default function ForRestaurantsPage() {
  return (
    <div className={styles.page}>
      {/* Hero */}
      <section className={styles.hero}>
        <div className={styles.heroInner}>
          <div className={styles.heroBadge}>Для ресторанов</div>
          <h1 className={styles.heroTitle}>
            Больше гостей.<br />Меньше пустых столиков.
          </h1>
          <p className={styles.heroSub}>
            Dastarkhan — система управления бронированием для ресторанов Казахстана.
            Автоматизируйте бронирование, уведомления и сбор отзывов.
          </p>
          <div className={styles.heroActions}>
            <Link href="/login?type=rest" className={styles.ctaPrimary}>
              Подключить ресторан
            </Link>
            <Link href="/catalog" className={styles.ctaSecondary}>
              Смотреть демо
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className={styles.section}>
        <div className={styles.sectionInner}>
          <h2 className={styles.sectionTitle}>Всё для вашего ресторана</h2>
          <div className={styles.featGrid}>
            {FEATURES.map(f => (
              <div key={f.title} className={styles.featCard}>
                <div className={styles.featIcon}>{f.icon}</div>
                <div className={styles.featTitle}>{f.title}</div>
                <div className={styles.featDesc}>{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className={styles.section}>
        <div className={styles.sectionInner}>
          <h2 className={styles.sectionTitle}>Тарифы</h2>
          <p className={styles.sectionSub}>14 дней бесплатно для всех новых ресторанов</p>
          <div className={styles.plansGrid}>
            {PLANS.map(p => (
              <div key={p.name} className={`${styles.planCard} ${p.highlight ? styles.planHighlight : ''}`}>
                {p.highlight && <div className={styles.planBadge}>Популярный</div>}
                <div className={styles.planName}>{p.name}</div>
                <div className={styles.planPrice}>{p.price}</div>
                <div className={styles.planPeriod}>{p.period}</div>
                <ul className={styles.planFeatures}>
                  {p.features.map(f => (
                    <li key={f} className={styles.planFeature}>
                      <span className={styles.planCheck}>✓</span> {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/login?type=rest"
                  className={`${styles.planCta} ${p.highlight ? styles.planCtaHighlight : ''}`}
                >
                  {p.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Bottom */}
      <section className={styles.ctaSection}>
        <div className={styles.ctaInner}>
          <h2 className={styles.ctaTitle}>Готовы начать?</h2>
          <p className={styles.ctaSub}>Подключите ресторан за 5 минут. Первые 14 дней бесплатно.</p>
          <Link href="/login?type=rest" className={styles.ctaPrimaryLg}>
            Подключить ресторан →
          </Link>
        </div>
      </section>
    </div>
  )
}

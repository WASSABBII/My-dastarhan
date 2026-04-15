'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { getCatalog } from '@/lib/catalog'
import type { Restaurant } from '@/types/api.types'
import styles from './page.module.css'

const CARD_BG = [styles.r1, styles.r2, styles.r3]
const CARD_EMOJI = ['🏯', '🌸', '🌿']

const HOW_STEPS = [
  {
    num: '1',
    icon: '🔍',
    colorClass: styles.s1,
    title: 'Найдите ресторан',
    desc: 'Фильтр по кухне, цене и рейтингу — найдите идеальное место за 30 секунд.',
  },
  {
    num: '2',
    icon: '📅',
    colorClass: styles.s2,
    title: 'Выберите стол',
    desc: 'Интерактивный план зала — видите точно, за каким столом сядете.',
  },
  {
    num: '3',
    icon: '✅',
    colorClass: styles.s3,
    title: 'Подтверждение',
    desc: 'Бронь мгновенно. Без звонков, без очередей — сразу на почту.',
  },
  {
    num: '4',
    icon: '🥂',
    colorClass: styles.s4,
    title: 'Наслаждайтесь',
    desc: 'Назовите имя на входе — ваш столик ждёт. Всё готово.',
  },
]

const GALLERY_ITEMS = [
  { emoji: '🏯', name: 'Казахская кухня', sub: 'Традиции и вкус', grad: styles.g1 },
  { emoji: '🌸', name: 'Японская кухня', sub: 'Суши и роллы', grad: styles.g2 },
  { emoji: '🌿', name: 'Европейская', sub: 'Изысканный вкус', grad: styles.g3 },
  { emoji: '🍕', name: 'Итальянская', sub: 'Пицца и паста', grad: styles.g4 },
  { emoji: '🥩', name: 'Гриль & Мясо', sub: 'Стейки на углях', grad: styles.g5 },
  { emoji: '🍜', name: 'Азиатская', sub: 'Паназиатские блюда', grad: styles.g6 },
  { emoji: '🥗', name: 'Здоровое питание', sub: 'Свежо и легко', grad: styles.g7 },
  { emoji: '🍷', name: 'Ресторан & Бар', sub: 'Коктейли и ужин', grad: styles.g8 },
]

const PARTNER_BENEFITS = [
  { icon: '🆓', text: 'Бесплатное размещение и настройка' },
  { icon: '📊', text: 'Аналитика броней и загруженности' },
  { icon: '⚡', text: 'Управление столиками в реальном времени' },
  { icon: '💬', text: 'Отзывы гостей и AI-чат поддержка' },
]

export default function HomePage() {
  const router = useRouter()
  const [activeGuests, setActiveGuests] = useState(2)
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0])
  const [time, setTime] = useState('18:00')
  const [cuisine, setCuisine] = useState('')
  const [restaurants, setRestaurants] = useState<Restaurant[]>([])

  useEffect(() => {
    getCatalog({ page: 1 }).then(res => {
      setRestaurants((res.data ?? []).slice(0, 3))
    }).catch(() => {})
  }, [])

  const handleShowRestaurants = () => {
    const params = new URLSearchParams()
    if (date) params.set('date', date)
    if (time) params.set('time', time)
    if (cuisine) params.set('cuisine', cuisine)
    params.set('guests', String(activeGuests))
    router.push(`/catalog?${params.toString()}`)
  }

  const scrollToHow = () => {
    document.getElementById('how-section')?.scrollIntoView({ behavior: 'smooth' })
  }

  const doubled = [...GALLERY_ITEMS, ...GALLERY_ITEMS]

  return (
    <>
      {/* ── HERO ─────────────────────────────────── */}
      <section className={styles.hero}>
        <div className={styles.heroLeft}>
          <div className={`${styles.heroBadge} anim-fade-up anim-d1`}>Алматы · 120+ ресторанов</div>

          <h1 className={`${styles.heroTitle} anim-fade-up anim-d2`}>
            Ваш стол<br />
            в лучших<br />
            <em>ресторанах</em><br />
            города
          </h1>

          <p className={`${styles.heroSubtitle} anim-fade-up anim-d3`}>
            Бронируйте столики в ресторанах Алматы за секунды. Без звонков, без ожидания — только удовольствие.
          </p>

          <div className={`${styles.heroFeatures} anim-fade-up anim-d3`}>
            <div className={styles.heroFeature}>
              <span className={styles.heroFeatureIcon}>⚡</span>
              Мгновенно
            </div>
            <div className={styles.heroFeature}>
              <span className={styles.heroFeatureIcon}>🆓</span>
              Бесплатно
            </div>
            <div className={styles.heroFeature}>
              <span className={styles.heroFeatureIcon}>🗺️</span>
              План зала
            </div>
            <div className={styles.heroFeature}>
              <span className={styles.heroFeatureIcon}>💬</span>
              AI-чат
            </div>
          </div>

          <div className={`${styles.heroActions} anim-fade-up anim-d4`}>
            <Link href="/catalog" className={styles.btnPrimary}>
              Найти стол
            </Link>
            <button className={styles.btnGhost} onClick={scrollToHow}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
              Как это работает
            </button>
          </div>

          <div className={`${styles.heroStats} anim-fade-up anim-d5`}>
            <div className={styles.stat}>
              <span className={styles.statNum}>120+</span>
              <span className={styles.statLabel}>Ресторанов</span>
            </div>
            <div className={styles.statDivider} />
            <div className={styles.stat}>
              <span className={styles.statNum}>4 800</span>
              <span className={styles.statLabel}>Броней в месяц</span>
            </div>
            <div className={styles.statDivider} />
            <div className={styles.stat}>
              <span className={styles.statNum}>4.9</span>
              <span className={styles.statLabel}>Рейтинг</span>
            </div>
          </div>
        </div>

        <div className={`${styles.heroRight} anim-fade-in anim-d1`}>
          <div className={styles.heroRightOrb} />
          <div className={styles.bookingCard}>
            <div className={styles.bookingCardTitle}>Забронировать стол</div>
            <div className={styles.bookingCardSubtitle}>Быстро и бесплатно</div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Дата</label>
              <input
                type="date"
                className={styles.formInput}
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>

            <div className={styles.formRow}>
              <div className={styles.formGroup} style={{ margin: 0 }}>
                <label className={styles.formLabel}>Время</label>
                <div className={styles.selectWrap}>
                  <select className={styles.formSelect} value={time} onChange={e => setTime(e.target.value)}>
                    <option value="18:00">18:00</option>
                    <option value="18:30">18:30</option>
                    <option value="19:00">19:00</option>
                    <option value="19:30">19:30</option>
                    <option value="20:00">20:00</option>
                    <option value="20:30">20:30</option>
                    <option value="21:00">21:00</option>
                  </select>
                </div>
              </div>
              <div className={styles.formGroup} style={{ margin: 0 }}>
                <label className={styles.formLabel}>Кухня</label>
                <div className={styles.selectWrap}>
                  <select className={styles.formSelect} value={cuisine} onChange={e => setCuisine(e.target.value)}>
                    <option value="">Любая</option>
                    <option value="Казахская">Казахская</option>
                    <option value="Европейская">Европейская</option>
                    <option value="Японская">Японская</option>
                    <option value="Итальянская">Итальянская</option>
                  </select>
                </div>
              </div>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Количество гостей</label>
              <div className={styles.guestsSelector}>
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    className={`${styles.guestBtn} ${activeGuests === n ? styles.guestBtnActive : ''}`}
                    onClick={() => setActiveGuests(n)}
                  >
                    {n === 5 ? '5+' : n}
                  </button>
                ))}
              </div>
            </div>

            <div className={styles.divider} />

            <button className={styles.submitBtn} onClick={handleShowRestaurants}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
              </svg>
              Показать рестораны
            </button>

            <div className={styles.trustRow}>
              <div className={styles.trustItem}>
                <div className={styles.trustDot} />
                Мгновенное подтверждение
              </div>
              <div className={styles.trustItem}>
                <div className={styles.trustDot} />
                Бесплатно
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── MARQUEE GALLERY ──────────────────────── */}
      <section className={styles.marqueeSection}>
        <div className={styles.marqueeTrack}>
          {doubled.map((item, i) => (
            <div key={i} className={`${styles.marqueeCard} ${item.grad}`}>
              <span className={styles.marqueeEmoji}>{item.emoji}</span>
              <div className={styles.marqueeText}>
                <div className={styles.marqueeName}>{item.name}</div>
                <div className={styles.marqueeSub}>{item.sub}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── RESTAURANTS ──────────────────────────── */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <div>
            <div className={styles.sectionLabel}>Популярные места</div>
            <div className={styles.sectionTitle}>Рестораны Алматы</div>
          </div>
          <Link href="/catalog" className={styles.sectionLink}>Все рестораны →</Link>
        </div>

        <div className={styles.restaurantsGrid}>
          {restaurants.map((r, idx) => (
            <Link key={r.id} href={`/${r.slug}`} className={styles.restaurantCard}>
              <div className={styles.restaurantImg}>
                <div className={`${styles.restaurantImgBg} ${CARD_BG[idx % CARD_BG.length]}`}>
                  {r.cover_photo_url
                    ? <img src={r.cover_photo_url} alt={r.name} className={styles.restaurantRealImg} />
                    : CARD_EMOJI[idx % CARD_EMOJI.length]
                  }
                </div>
              </div>
              <div className={styles.restaurantInfo}>
                <div className={styles.restaurantName}>{r.name}</div>
                <div className={styles.restaurantMeta}>
                  <span className={styles.restaurantCuisine}>{r.cuisine_type}</span>
                </div>
                {r.address && <div className={styles.restaurantAddress}>{r.address}</div>}
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────── */}
      <section className={styles.howSection} id="how-section">
        <div className={styles.howHeader}>
          <div className={styles.sectionLabel}>Просто и быстро</div>
          <h2 className={styles.howTitle}>Забронировать стол — легко</h2>
          <p className={styles.howSubtitle}>4 шага и ваш стол готов. Без регистрации, без звонков.</p>
        </div>

        <div className={styles.stepsGrid}>
          {HOW_STEPS.map((step, idx) => (
            <div key={step.num} className={styles.stepCard}>
              {idx < HOW_STEPS.length - 1 && <div className={styles.stepArrow}>→</div>}
              <div className={`${styles.stepIconCircle} ${step.colorClass}`}>
                <span className={styles.stepEmoji}>{step.icon}</span>
              </div>
              <div className={`${styles.stepNumBadge} ${step.colorClass}`}>{step.num}</div>
              <h3 className={styles.stepTitle}>{step.title}</h3>
              <p className={styles.stepDesc}>{step.desc}</p>
            </div>
          ))}
        </div>

        <div className={styles.howCta}>
          <Link href="/catalog" className={styles.howCtaBtn}>
            Забронировать столик
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
            </svg>
          </Link>
          <p className={styles.howCtaNote}>Бесплатно · Мгновенное подтверждение · Без регистрации</p>
        </div>
      </section>

      {/* ── PARTNER SECTION ──────────────────────── */}
      <section className={styles.partnerSection}>
        <div className={styles.partnerLeft}>
          <div className={styles.partnerLabel}>Для ресторанов</div>
          <h2 className={styles.partnerTitle}>
            Развивайте бизнес<br />
            с <span className={styles.partnerAccent}>Dastarkhan</span>
          </h2>
          <p className={styles.partnerSubtitle}>
            Подключите ваш ресторан и получайте новых гостей каждый день.
            Управляйте бронями онлайн, смотрите аналитику, собирайте отзывы.
          </p>
          <ul className={styles.partnerBenefits}>
            {PARTNER_BENEFITS.map((b, i) => (
              <li key={i} className={styles.partnerBenefit}>
                <span className={styles.partnerBenefitIcon}>{b.icon}</span>
                {b.text}
              </li>
            ))}
          </ul>
          <div className={styles.partnerActions}>
            <Link href="/for-restaurants" className={styles.partnerBtn}>
              Стать партнёром →
            </Link>
            <span className={styles.partnerBtnNote}>Бесплатно · Без комиссии</span>
          </div>
        </div>

        <div className={styles.partnerRight}>
          <div className={styles.partnerStat}>
            <div className={styles.partnerStatNum}>120+</div>
            <div className={styles.partnerStatLabel}>ресторанов уже с нами</div>
          </div>
          <div className={styles.partnerStat}>
            <div className={styles.partnerStatNum}>4 800</div>
            <div className={styles.partnerStatLabel}>броней в месяц</div>
          </div>
          <div className={styles.partnerStat}>
            <div className={styles.partnerStatNum}>0 ₸</div>
            <div className={styles.partnerStatLabel}>стоимость подключения</div>
          </div>
          <div className={styles.partnerGraphic}>
            <span className={styles.partnerGraphicEmoji}>🍽️</span>
          </div>
        </div>
      </section>
    </>
  )
}

'use client'

import { useState } from 'react'
import Link from 'next/link'
import Navbar from '@/components/layout/Navbar/Navbar'
import Footer from '@/components/layout/Footer/Footer'
import styles from './page.module.css'

const RESTAURANTS = [
  {
    id: 1,
    name: 'Дастархан House',
    cuisine: 'Казахская · ₸₸₸',
    rating: '4.9',
    bgClass: styles.r1,
    emoji: '🏯',
    tagClass: styles.tagFree,
    tagText: 'Есть места',
    slots: [
      { time: '18:00', taken: false },
      { time: '19:30', taken: false },
      { time: '20:00', taken: false },
      { time: '21:00', taken: true },
    ],
  },
  {
    id: 2,
    name: 'Sakura Garden',
    cuisine: 'Японская · ₸₸₸₸',
    rating: '4.7',
    bgClass: styles.r2,
    emoji: '🌸',
    tagClass: styles.tagFew,
    tagText: 'Мало мест',
    slots: [
      { time: '18:00', taken: true },
      { time: '19:00', taken: false },
      { time: '20:00', taken: true },
      { time: '21:00', taken: true },
    ],
  },
  {
    id: 3,
    name: 'Verde Almaty',
    cuisine: 'Европейская · ₸₸',
    rating: '4.8',
    bgClass: styles.r3,
    emoji: '🌿',
    tagClass: styles.tagFree,
    tagText: 'Есть места',
    slots: [
      { time: '18:30', taken: false },
      { time: '19:00', taken: false },
      { time: '20:30', taken: false },
      { time: '21:00', taken: false },
    ],
  },
]

const HOW_STEPS = [
  {
    num: '1',
    colorClass: styles.s1,
    title: 'Выберите ресторан',
    desc: 'Фильтруйте по кухне, цене, рейтингу и доступным столикам на нужную дату.',
  },
  {
    num: '2',
    colorClass: styles.s2,
    title: 'Укажите детали',
    desc: 'Дата, время, количество гостей — и любые пожелания к столику или поводу.',
  },
  {
    num: '3',
    colorClass: styles.s3,
    title: 'Подтверждение',
    desc: 'Бронь подтверждается мгновенно. Напоминание придёт за час до визита.',
  },
  {
    num: '4',
    colorClass: styles.s4,
    title: 'Наслаждайтесь',
    desc: 'Просто назовите имя на входе — ваш стол готов, всё уже организовано.',
  },
]

export default function HomePage() {
  const [activeGuests, setActiveGuests] = useState(2)
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0])

  const scrollToHow = () => {
    document.getElementById('how-section')?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <>
      <Navbar />

      {/* ── HERO ─────────────────────────────────── */}
      <section className={styles.hero}>
        <div className={styles.heroLeft}>
          <div className={styles.heroBadge}>Алматы · 120+ ресторанов</div>

          <h1 className={styles.heroTitle}>
            Ваш стол<br />
            в лучших<br />
            <em>ресторанах</em><br />
            города
          </h1>

          <p className={styles.heroSubtitle}>
            Бронируйте столики в ресторанах Алматы за секунды. Без звонков, без ожидания — только удовольствие.
          </p>

          <div className={styles.heroActions}>
            <Link href="#" className={styles.btnPrimary}>
              Найти стол
            </Link>
            <button className={styles.btnGhost} onClick={scrollToHow}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
              Как это работает
            </button>
          </div>

          <div className={styles.heroStats}>
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

        <div className={styles.heroRight}>
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
                  <select className={styles.formSelect}>
                    <option>18:00</option>
                    <option>18:30</option>
                    <option>19:00</option>
                    <option>19:30</option>
                    <option>20:00</option>
                    <option>20:30</option>
                    <option>21:00</option>
                  </select>
                </div>
              </div>
              <div className={styles.formGroup} style={{ margin: 0 }}>
                <label className={styles.formLabel}>Кухня</label>
                <div className={styles.selectWrap}>
                  <select className={styles.formSelect}>
                    <option>Любая</option>
                    <option>Казахская</option>
                    <option>Европейская</option>
                    <option>Японская</option>
                    <option>Итальянская</option>
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

            <button className={styles.submitBtn}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
              </svg>
              Показать столики
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

      {/* ── RESTAURANTS ──────────────────────────── */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <div>
            <div className={styles.sectionLabel}>Популярные места</div>
            <div className={styles.sectionTitle}>Рестораны Алматы</div>
          </div>
          <Link href="#" className={styles.sectionLink}>Все рестораны →</Link>
        </div>

        <div className={styles.restaurantsGrid}>
          {RESTAURANTS.map((r) => (
            <div key={r.id} className={styles.restaurantCard}>
              <div className={styles.restaurantImg}>
                <div className={`${styles.restaurantImgBg} ${r.bgClass}`}>
                  {r.emoji}
                </div>
                <div className={styles.restaurantBadge}>★ {r.rating}</div>
                <div className={`${styles.restaurantTag} ${r.tagClass}`}>{r.tagText}</div>
              </div>
              <div className={styles.restaurantInfo}>
                <div className={styles.restaurantName}>{r.name}</div>
                <div className={styles.restaurantMeta}>
                  <span className={styles.restaurantCuisine}>{r.cuisine}</span>
                  <span className={styles.restaurantRating}>
                    <span className={styles.star}>★</span> {r.rating}
                  </span>
                </div>
                <div className={styles.restaurantTimes}>
                  {r.slots.map((slot, i) => (
                    <div
                      key={i}
                      className={`${styles.timeSlot} ${slot.taken ? styles.timeSlotTaken : ''}`}
                    >
                      {slot.time}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────── */}
      <section className={styles.howSection} id="how-section">
        <div>
          <div className={styles.sectionLabel}>Просто и быстро</div>
          <div className={styles.sectionTitle}>Как это работает</div>
        </div>

        <div className={styles.stepsGrid}>
          {HOW_STEPS.map((step) => (
            <div key={step.num} className={styles.step}>
              <div className={`${styles.stepNum} ${step.colorClass}`}>{step.num}</div>
              <div className={styles.stepTitle}>{step.title}</div>
              <div className={styles.stepDesc}>{step.desc}</div>
            </div>
          ))}
        </div>
      </section>

      <Footer />
    </>
  )
}

'use client'
import { useState } from 'react'
import { useBookingStore } from '@/store/booking.store'
import { createBooking } from '@/lib/bookings'
import styles from './Step3.module.css'

function formatDate(dateStr: string) {
  if (!dateStr) return ''
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })
}

const ROW_ICONS: Record<string, string> = {
  'Дата':     '📅',
  'Время':    '🕐',
  'Гостей':   '👥',
  'Столиков': '🪑',
  'Имя':      '👤',
  'Телефон':  '📞',
  'Повод':    '🎉',
}

export default function Step3() {
  const store = useBookingStore()
  const [agreed, setAgreed] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (store.confirmedBookingId) {
    return (
      <div className={styles.success}>
        <div className={styles.successIcon}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <h2 className={styles.successTitle}>Бронь подтверждена!</h2>
        <div className={styles.bookingCode}>{store.confirmedBookingId.slice(0, 8).toUpperCase()}</div>
        <p className={styles.successText}>Детали отправлены на ваш телефон</p>
        <div className={styles.successActions}>
          {store.cancelToken && (
            <a href={`/booking/cancel/${store.cancelToken}`} className={styles.cancelLink}>
              Отменить бронирование
            </a>
          )}
          <a href="/catalog" className={styles.homeBtn}>Вернуться в каталог</a>
        </div>
      </div>
    )
  }

  const handleSubmit = async () => {
    if (!agreed || !store.restaurant) return
    setLoading(true)
    setError(null)
    try {
      const booking = await createBooking({
        restaurantId: store.restaurant.id,
        tableIds: store.selectedTableIds,
        date: store.date,
        timeStart: store.time,
        guestsCount: store.guests,
        estimatedDuration: store.duration,
      })
      store.setConfirmed(booking.id, booking.cancel_token)
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } }
      setError(axiosErr?.response?.data?.message || 'Ошибка при создании брони')
    } finally {
      setLoading(false)
    }
  }

  const rows = [
    { label: 'Дата',     value: formatDate(store.date) },
    { label: 'Время',    value: store.time },
    { label: 'Гостей',   value: `${store.guests} чел.` },
    { label: 'Столиков', value: `${store.selectedTableIds.length} шт.` },
    { label: 'Имя',      value: store.guestName },
    { label: 'Телефон',  value: store.guestPhone },
    ...(store.occasion ? [{ label: 'Повод', value: store.occasion }] : []),
  ]

  const coverUrl = store.restaurant?.cover_photo_url

  return (
    <div className={styles.step}>
      {/* ── Restaurant card ── */}
      <div className={styles.restCard}>
        {/* Photo */}
        <div className={styles.restPhoto}>
          {coverUrl
            ? <img src={coverUrl} alt={store.restaurant?.name} className={styles.restImg} />
            : <div className={styles.restImgFallback}>🍽️</div>
          }
          <div className={styles.restPhotoOverlay} />
        </div>

        {/* Info overlay on photo */}
        <div className={styles.restInfo}>
          {store.restaurant?.cuisine_type && (
            <span className={styles.restCuisine}>{store.restaurant.cuisine_type}</span>
          )}
          <h2 className={styles.restName}>{store.restaurant?.name}</h2>
          {store.restaurant?.address && (
            <p className={styles.restAddress}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
              {store.restaurant.address}
            </p>
          )}
        </div>
      </div>

      {/* ── Booking details ── */}
      <div className={styles.detailsCard}>
        <div className={styles.detailsTitle}>Детали бронирования</div>
        <div className={styles.rows}>
          {rows.map(r => (
            <div key={r.label} className={styles.row}>
              <span className={styles.rowLabel}>
                <span className={styles.rowIcon}>{ROW_ICONS[r.label] ?? '•'}</span>
                {r.label}
              </span>
              <span className={styles.rowValue}>{r.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Terms ── */}
      <label className={styles.checkLabel}>
        <div className={`${styles.checkbox} ${agreed ? styles.checkboxChecked : ''}`}
          onClick={() => setAgreed(v => !v)}>
          {agreed && (
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          )}
        </div>
        <span>
          Я согласен с условиями отмены бронирования.{' '}
          <span className={styles.termsAccent}>Бесплатная отмена за 2 часа до визита.</span>
        </span>
      </label>

      {error && (
        <div className={styles.errorBox}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          {error}
        </div>
      )}

      {/* ── Actions ── */}
      <div className={styles.actions}>
        <button className={styles.backBtn} onClick={() => store.setStep(2)}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
          Назад
        </button>
        <button
          className={styles.confirmBtn}
          disabled={!agreed || loading}
          onClick={handleSubmit}
        >
          {loading ? (
            <>
              <span className={styles.spinner} />
              Создаём бронь...
            </>
          ) : (
            <>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              Подтвердить бронирование
            </>
          )}
        </button>
      </div>
    </div>
  )
}

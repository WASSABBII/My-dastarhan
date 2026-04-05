'use client'
import { useState } from 'react'
import { useBookingStore } from '@/store/booking.store'
import { createBooking } from '@/lib/bookings'
import styles from './Step3.module.css'

export default function Step3() {
  const store = useBookingStore()
  const [agreed, setAgreed] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (store.confirmedBookingId) {
    return (
      <div className={styles.success}>
        <div className={styles.successIcon}>✓</div>
        <h2 className={styles.successTitle}>Бронь подтверждена!</h2>
        <div className={styles.bookingCode}>{store.confirmedBookingId.slice(0, 8).toUpperCase()}</div>
        <p className={styles.successText}>Детали отправлены на ваш телефон</p>
        {store.cancelToken && (
          <a href={`/booking/cancel/${store.cancelToken}`} className={styles.cancelLink}>
            Отменить бронирование
          </a>
        )}
        <a href="/catalog" className={styles.homeBtn}>Вернуться в каталог</a>
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

  return (
    <div className={styles.step}>
      <h2 className={styles.title}>Подтверждение бронирования</h2>

      <div className={styles.card}>
        <h3 className={styles.restaurantName}>{store.restaurant?.name}</h3>
        <div className={styles.rows}>
          <div className={styles.row}><span>Дата</span><span>{store.date}</span></div>
          <div className={styles.row}><span>Время</span><span>{store.time}</span></div>
          <div className={styles.row}><span>Гостей</span><span>{store.guests}</span></div>
          <div className={styles.row}><span>Столиков</span><span>{store.selectedTableIds.length}</span></div>
          <div className={styles.row}><span>Имя</span><span>{store.guestName}</span></div>
          <div className={styles.row}><span>Телефон</span><span>{store.guestPhone}</span></div>
          {store.occasion && <div className={styles.row}><span>Повод</span><span>{store.occasion}</span></div>}
        </div>
      </div>

      <div className={styles.terms}>
        <label className={styles.checkLabel}>
          <input type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)} />
          <span>Я согласен с условиями отмены бронирования. Бесплатная отмена за 2 часа до визита.</span>
        </label>
      </div>

      {error && <div className={styles.errorBox}>{error}</div>}

      <div className={styles.actions}>
        <button className={styles.backBtn} onClick={() => store.setStep(2)}>← Назад</button>
        <button
          className={styles.confirmBtn}
          disabled={!agreed || loading}
          onClick={handleSubmit}
        >
          {loading ? 'Создаём бронь...' : '✓ Подтвердить бронирование'}
        </button>
      </div>
    </div>
  )
}

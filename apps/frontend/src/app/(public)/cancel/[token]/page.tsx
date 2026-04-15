'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import styles from './page.module.css'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3005/api'

const MONTHS = ['января','февраля','марта','апреля','мая','июня','июля','августа','сентября','октября','ноября','декабря']

function formatDate(dateStr: string) {
  const d = new Date(dateStr)
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`
}

interface BookingInfo {
  id: string
  date: string
  time_start: string
  time_end: string
  guests_count: number
  status: string
  restaurant?: { name: string; address: string }
}

export default function CancelPage() {
  const { token } = useParams() as { token: string }
  const router = useRouter()
  const [booking, setBooking] = useState<BookingInfo | null>(null)
  const [notFound, setNotFound] = useState(false)
  const [cancelled, setCancelled] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetch(`${API}/bookings/cancel/${token}`)
      .then(r => {
        if (!r.ok) throw new Error()
        return r.json()
      })
      .then(data => {
        if (data.status === 'cancelled') {
          setCancelled(true)
        }
        setBooking(data)
      })
      .catch(() => setNotFound(true))
  }, [token])

  const handleConfirm = async () => {
    setLoading(true)
    try {
      const res = await fetch(`${API}/bookings/cancel/${token}`, { method: 'POST' })
      if (!res.ok) throw new Error()
      setCancelled(true)
    } catch {
      alert('Ошибка при отмене. Попробуйте ещё раз.')
    } finally {
      setLoading(false)
    }
  }

  if (notFound) {
    return (
      <div className={styles.page}>
        <div className={styles.card}>
          <div className={styles.icon}>✗</div>
          <div className={styles.title}>Ссылка недействительна</div>
          <div className={styles.sub}>Бронирование не найдено или ссылка устарела.</div>
          <Link href="/" className={styles.backBtn}>На главную</Link>
        </div>
      </div>
    )
  }

  if (!booking) {
    return <div className={styles.page}><div className={styles.loading}>Загрузка...</div></div>
  }

  if (cancelled || booking.status === 'cancelled') {
    return (
      <div className={styles.page}>
        <div className={styles.card}>
          <div className={styles.iconGray}>✓</div>
          <div className={styles.title}>Бронирование отменено</div>
          <div className={styles.sub}>
            Ваша бронь в {booking.restaurant?.name} на {formatDate(booking.date)} успешно отменена.
          </div>
          <Link href="/catalog" className={styles.backBtn}>Найти другой ресторан</Link>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.restaurantName}>{booking.restaurant?.name}</div>
        <div className={styles.bookingDetails}>
          <div className={styles.detailRow}>
            <span className={styles.detailLabel}>Дата</span>
            <span className={styles.detailValue}>{formatDate(booking.date)}</span>
          </div>
          <div className={styles.detailRow}>
            <span className={styles.detailLabel}>Время</span>
            <span className={styles.detailValue}>
              {booking.time_start?.slice(0,5)} – {booking.time_end?.slice(0,5)}
            </span>
          </div>
          <div className={styles.detailRow}>
            <span className={styles.detailLabel}>Гостей</span>
            <span className={styles.detailValue}>
              {booking.guests_count} {booking.guests_count === 1 ? 'гость' : booking.guests_count < 5 ? 'гостя' : 'гостей'}
            </span>
          </div>
        </div>

        <div className={styles.title}>Отменить бронирование?</div>
        <div className={styles.sub}>Это действие необратимо. Стол будет освобождён.</div>

        <div className={styles.actions}>
          <button
            className={styles.cancelBtn}
            onClick={handleConfirm}
            disabled={loading}
          >
            {loading ? 'Отменяем...' : 'Да, отменить'}
          </button>
          <button className={styles.keepBtn} onClick={() => router.back()}>
            Нет, оставить
          </button>
        </div>
      </div>
    </div>
  )
}

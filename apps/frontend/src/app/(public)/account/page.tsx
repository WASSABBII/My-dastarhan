'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import styles from './page.module.css'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3005/api'

type BookingStatus = 'pending' | 'confirmed' | 'arrived' | 'cancelled' | 'no_show' | 'extended'

interface Booking {
  id: string
  date: string
  time_start: string
  time_end: string
  guests_count: number
  status: BookingStatus
  cancel_token?: string
  restaurant?: { name?: string; address?: string }
  booking_tables?: Array<{ table?: { label?: string } }>
}

const STATUS_LABELS: Record<BookingStatus, string> = {
  pending: 'Ожидает',
  confirmed: 'Подтверждён',
  arrived: 'Пришли',
  cancelled: 'Отменена',
  no_show: 'Не пришли',
  extended: 'Продлён',
}

const STATUS_CLASS: Record<BookingStatus, string> = {
  pending: styles.pillPending,
  confirmed: styles.pillConfirmed,
  arrived: styles.pillArrived,
  cancelled: styles.pillCancelled,
  no_show: styles.pillNoshow,
  extended: styles.pillExtended,
}

const MONTHS_SHORT = ['янв','фев','мар','апр','май','июн','июл','авг','сен','окт','ноя','дек']

function formatDate(dateStr: string) {
  const d = new Date(dateStr)
  return `${d.getDate()} ${MONTHS_SHORT[d.getMonth()]} ${d.getFullYear()}`
}

export default function AccountPage() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/login?redirect=/account')
      return
    }
    fetch(`${API}/bookings/my`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(data => setBookings(Array.isArray(data) ? data : []))
      .catch(() => setBookings([]))
      .finally(() => setLoading(false))
  }, [router])

  const handleCancel = async (id: string) => {
    if (!confirm('Отменить бронирование?')) return
    const token = localStorage.getItem('token')
    await fetch(`${API}/bookings/${id}/cancel`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token || ''}` },
    })
    setBookings(prev => prev.map(b => b.id === id ? { ...b, status: 'cancelled' as const } : b))
  }

  const tableLabels = (b: Booking) =>
    b.booking_tables?.map(bt => bt.table?.label || '').filter(Boolean).join(', ')

  return (
    <div className={styles.page}>
      <div className={styles.inner}>
        <h1 className={styles.title}>Мои брони</h1>
        <p className={styles.subtitle}>История всех ваших бронирований</p>

        {loading ? (
          <div className={styles.loading}>Загрузка...</div>
        ) : bookings.length === 0 ? (
          <div className={styles.empty}>
            <div className={styles.emptyTitle}>Броней пока нет</div>
            <div className={styles.emptyText}>Забронируйте столик в любимом ресторане</div>
            <Link href="/catalog" className={styles.catalogLink}>Найти ресторан</Link>
          </div>
        ) : (
          bookings.map(b => (
            <div key={b.id} className={styles.bookingCard}>
              <div className={styles.cardLeft}>
                <div className={styles.restaurantName}>{b.restaurant?.name || 'Ресторан'}</div>
                <div className={styles.dateTime}>
                  {formatDate(b.date)} · {b.time_start?.slice(0, 5)} – {b.time_end?.slice(0, 5)}
                </div>
                <div className={styles.guests}>
                  {b.guests_count} {b.guests_count === 1 ? 'гость' : b.guests_count < 5 ? 'гостя' : 'гостей'}
                  {tableLabels(b) && ` · ${tableLabels(b)}`}
                </div>
              </div>
              <div className={styles.cardRight}>
                <span className={`${styles.pill} ${STATUS_CLASS[b.status]}`}>
                  <span className={styles.pillDot} />
                  {STATUS_LABELS[b.status]}
                </span>
                {(b.status === 'pending' || b.status === 'confirmed') && (
                  <button className={styles.cancelBtn} onClick={() => handleCancel(b.id)}>
                    Отменить
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

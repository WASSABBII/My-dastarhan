'use client'

import { useEffect, useState, useCallback } from 'react'
import dynamic from 'next/dynamic'
import styles from './page.module.css'

const BookingKanban = dynamic(() => import('@/components/admin/BookingKanban'), { ssr: false })

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3005/api'

type BookingStatus = 'pending' | 'confirmed' | 'arrived' | 'cancelled' | 'no_show' | 'extended'

interface Booking {
  id: string
  date: string
  time_start: string
  time_end: string
  guests_count: number
  status: BookingStatus
  client?: { name?: string; phone?: string }
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

const FILTERS: Array<{ key: string; label: string; cls: string }> = [
  { key: 'all', label: 'Все', cls: styles.sfAll },
  { key: 'pending', label: 'Ожидают', cls: styles.sfPending },
  { key: 'confirmed', label: 'Подтверждены', cls: styles.sfConfirmed },
  { key: 'arrived', label: 'Пришли', cls: styles.sfArrived },
  { key: 'no_show', label: 'Не пришли', cls: styles.sfNoshow },
  { key: 'cancelled', label: 'Отменены', cls: styles.sfCancelled },
]

function todayISO() {
  return new Date().toISOString().split('T')[0]
}

function authHeader() {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : ''
  return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
}

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [restaurantId, setRestaurantId] = useState<string | null>(null)
  const [date, setDate] = useState(todayISO())
  const [filter, setFilter] = useState('all')
  const [loading, setLoading] = useState(false)
  const [viewMode, setViewMode] = useState<'table' | 'kanban'>('table')

  // Load restaurant id once
  useEffect(() => {
    fetch(`${API}/admin/restaurant`, { headers: authHeader() })
      .then(r => r.json())
      .then(data => {
        const list = Array.isArray(data) ? data : []
        if (list[0]?.id) setRestaurantId(list[0].id)
      })
      .catch(() => {})
  }, [])

  const loadBookings = useCallback(() => {
    if (!restaurantId) return
    setLoading(true)
    fetch(`${API}/bookings/admin?restaurantId=${restaurantId}&date=${date}`, {
      headers: authHeader(),
    })
      .then(r => r.json())
      .then(data => setBookings(Array.isArray(data) ? data : []))
      .catch(() => setBookings([]))
      .finally(() => setLoading(false))
  }, [restaurantId, date])

  useEffect(() => {
    loadBookings()
  }, [loadBookings])

  const updateStatus = async (id: string, status: BookingStatus) => {
    await fetch(`${API}/bookings/admin/${id}/status`, {
      method: 'PATCH',
      headers: authHeader(),
      body: JSON.stringify({ status }),
    })
    loadBookings()
  }

  const visible = filter === 'all' ? bookings : bookings.filter(b => b.status === filter)

  const tableLabels = (b: Booking) =>
    b.booking_tables?.map(bt => bt.table?.label || '—').join(', ') || '—'

  return (
    <div>
      <div className={styles.toolbar}>
        <div className={styles.toolbarLeft}>
          <input
            type="date"
            className={styles.dateInput}
            value={date}
            onChange={e => setDate(e.target.value)}
          />
          {viewMode === 'table' && (
            <div className={styles.statusFilters}>
              {FILTERS.map(f => (
                <button
                  key={f.key}
                  className={`${styles.sf} ${f.cls} ${filter === f.key ? styles.active : ''}`}
                  onClick={() => setFilter(f.key)}
                >
                  {f.label}
                </button>
              ))}
            </div>
          )}
        </div>
        <div className={styles.toolbarRight}>
          <div className={styles.viewToggle}>
            <button
              className={`${styles.viewBtn} ${viewMode === 'table' ? styles.viewActive : ''}`}
              onClick={() => setViewMode('table')}
              title="Таблица"
            >
              ≡
            </button>
            <button
              className={`${styles.viewBtn} ${viewMode === 'kanban' ? styles.viewActive : ''}`}
              onClick={() => setViewMode('kanban')}
              title="Канбан"
            >
              ⊞
            </button>
          </div>
          <button className={styles.addBtn} onClick={loadBookings}>
            ↻ Обновить
          </button>
        </div>
      </div>

      <div className={styles.tableWrap}>
        {loading ? (
          <div className={styles.loading}>Загрузка...</div>
        ) : viewMode === 'kanban' ? (
          <BookingKanban bookings={bookings} onStatusChange={updateStatus} />
        ) : visible.length === 0 ? (
          <div className={styles.empty}>Броней нет</div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Гость</th>
                <th>Время</th>
                <th>Гостей</th>
                <th>Стол</th>
                <th>Статус</th>
                <th>Действия</th>
              </tr>
            </thead>
            <tbody>
              {visible.map(b => (
                <tr key={b.id}>
                  <td>
                    <div className={styles.tdName}>{b.client?.name || 'Гость'}</div>
                    <div className={styles.tdPhone}>{b.client?.phone || ''}</div>
                  </td>
                  <td className={styles.tdTime}>{b.time_start?.slice(0, 5)}</td>
                  <td>{b.guests_count}</td>
                  <td>{tableLabels(b)}</td>
                  <td>
                    <span className={`${styles.pill} ${STATUS_CLASS[b.status]}`}>
                      <span className={styles.pillDot} />
                      {STATUS_LABELS[b.status]}
                    </span>
                  </td>
                  <td>
                    {b.status === 'pending' && (
                      <>
                        <button
                          className={`${styles.actionBtn} ${styles.actionBtnGreen}`}
                          onClick={() => updateStatus(b.id, 'confirmed')}
                        >
                          Подтвердить
                        </button>
                        <button
                          className={styles.actionBtn}
                          onClick={() => updateStatus(b.id, 'cancelled')}
                        >
                          Отменить
                        </button>
                      </>
                    )}
                    {b.status === 'confirmed' && (
                      <>
                        <button
                          className={`${styles.actionBtn} ${styles.actionBtnGreen}`}
                          onClick={() => updateStatus(b.id, 'arrived')}
                        >
                          Пришли
                        </button>
                        <button
                          className={styles.actionBtn}
                          onClick={() => updateStatus(b.id, 'no_show')}
                        >
                          Не пришли
                        </button>
                        <button
                          className={styles.actionBtn}
                          onClick={() => updateStatus(b.id, 'cancelled')}
                        >
                          Отменить
                        </button>
                      </>
                    )}
                    {b.status === 'arrived' && (
                      <button
                        className={styles.actionBtn}
                        onClick={() => updateStatus(b.id, 'extended')}
                      >
                        Продлить
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

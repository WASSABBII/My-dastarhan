'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useBookingStore } from '@/store/booking.store'
import styles from './BookingWidget.module.css'

interface BookingWidgetProps {
  onSearch: (date: string, time: string, guests: number) => void
}

export default function BookingWidget({ onSearch }: BookingWidgetProps) {
  const router = useRouter()
  const today = new Date().toISOString().split('T')[0]
  const [date, setDate] = useState(today)
  const [time, setTime] = useState('19:00')
  const [guests, setGuests] = useState(2)

  const selectedCount = useBookingStore(s => s.selectedTableIds.length)

  const handleSearch = () => {
    if (!date || !time) return
    onSearch(date, time, guests)
  }

  const handleBook = () => {
    router.push('/booking')
  }

  const guestOptions = [1, 2, 3, 4, 5, 6]

  return (
    <div className={styles.widget}>
      <h3 className={styles.title}>Забронировать стол</h3>

      <div className={styles.field}>
        <label className={styles.label}>Дата</label>
        <input type="date" className={styles.input} value={date} min={today}
          onChange={e => setDate(e.target.value)} />
      </div>

      <div className={styles.field}>
        <label className={styles.label}>Время</label>
        <input type="time" className={styles.input} value={time}
          onChange={e => setTime(e.target.value)} />
      </div>

      <div className={styles.field}>
        <label className={styles.label}>Гостей</label>
        <div className={styles.guestBtns}>
          {guestOptions.map(n => (
            <button key={n} type="button"
              className={`${styles.guestBtn} ${guests === n ? styles.active : ''}`}
              onClick={() => setGuests(n)}
            >{n === 6 ? '5+' : n}</button>
          ))}
        </div>
      </div>

      <button type="button" className={styles.searchBtn} onClick={handleSearch}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
        Показать план зала
      </button>

      {selectedCount > 0 && (
        <div className={styles.bookNowWrap}>
          <div className={styles.selectedInfo}>
            <span className={styles.selectedDot} />
            Выбрано столиков: <strong>{selectedCount}</strong>
          </div>
          <button type="button" className={styles.bookBtn} onClick={handleBook}>
            Оформить бронь →
          </button>
        </div>
      )}
    </div>
  )
}

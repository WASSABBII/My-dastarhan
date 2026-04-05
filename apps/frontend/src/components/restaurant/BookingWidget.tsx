'use client'
import { useState } from 'react'
import styles from './BookingWidget.module.css'

interface BookingWidgetProps {
  onSearch: (date: string, time: string, guests: number) => void
}

export default function BookingWidget({ onSearch }: BookingWidgetProps) {
  const today = new Date().toISOString().split('T')[0]
  const [date, setDate] = useState(today)
  const [time, setTime] = useState('19:00')
  const [guests, setGuests] = useState(2)

  const handleSearch = () => {
    if (!date || !time) return
    onSearch(date, time, guests)
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
        Показать план зала
      </button>
    </div>
  )
}

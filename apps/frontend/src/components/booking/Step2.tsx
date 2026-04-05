'use client'
import { useState } from 'react'
import { useBookingStore } from '@/store/booking.store'
import styles from './Step2.module.css'

const OCCASIONS = [
  { id: 'birthday', label: 'День рождения', emoji: '🎂' },
  { id: 'date', label: 'Свидание', emoji: '💍' },
  { id: 'business', label: 'Деловой ужин', emoji: '💼' },
  { id: 'anniversary', label: 'Годовщина', emoji: '🥂' },
  { id: 'family', label: 'Семейный', emoji: '👨‍👩‍👧‍👦' },
  { id: 'other', label: 'Просто так', emoji: '✨' },
]

export default function Step2() {
  const store = useBookingStore()
  const [name, setName] = useState(store.guestName)
  const [phone, setPhone] = useState(store.guestPhone)
  const [email, setEmail] = useState(store.guestEmail)
  const [occasion, setOccasion] = useState(store.occasion)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validate = () => {
    const errs: Record<string, string> = {}
    if (!name.trim()) errs.name = 'Введите имя'
    if (!phone.trim()) errs.phone = 'Введите телефон'
    return errs
  }

  const handleNext = () => {
    const errs = validate()
    if (Object.keys(errs).length > 0) { setErrors(errs); return }
    store.setGuestDetails(name, phone, email, occasion)
    store.setStep(3)
  }

  return (
    <div className={styles.step}>
      <h2 className={styles.title}>Детали бронирования</h2>

      <div className={styles.form}>
        <div className={styles.field}>
          <label className={styles.label}>Имя *</label>
          <input className={`${styles.input} ${errors.name ? styles.error : ''}`}
            type="text" placeholder="Ваше имя" value={name}
            onChange={e => { setName(e.target.value); setErrors(prev => ({ ...prev, name: '' })) }} />
          {errors.name && <span className={styles.errMsg}>{errors.name}</span>}
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Телефон *</label>
          <input className={`${styles.input} ${errors.phone ? styles.error : ''}`}
            type="tel" placeholder="+7 (777) 000-00-00" value={phone}
            onChange={e => { setPhone(e.target.value); setErrors(prev => ({ ...prev, phone: '' })) }} />
          {errors.phone && <span className={styles.errMsg}>{errors.phone}</span>}
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Email (необязательно)</label>
          <input className={styles.input} type="email" placeholder="email@example.com"
            value={email} onChange={e => setEmail(e.target.value)} />
        </div>
      </div>

      <div className={styles.occasionSection}>
        <label className={styles.label}>Повод (необязательно)</label>
        <div className={styles.occasions}>
          {OCCASIONS.map(o => (
            <button key={o.id} type="button"
              className={`${styles.occasionBtn} ${occasion === o.id ? styles.active : ''}`}
              onClick={() => setOccasion(occasion === o.id ? '' : o.id)}
            >
              <span className={styles.occasionEmoji}>{o.emoji}</span>
              <span>{o.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className={styles.actions}>
        <button className={styles.backBtn} onClick={() => store.setStep(1)}>← Назад</button>
        <button className={styles.nextBtn} onClick={handleNext}>Продолжить →</button>
      </div>
    </div>
  )
}

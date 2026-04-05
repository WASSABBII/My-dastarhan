'use client'

import { useEffect, useState } from 'react'
import styles from './page.module.css'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3005/api'

function authHeader() {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : ''
  return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
}

interface Restaurant {
  id: string
  name: string
  address: string
  phone?: string
  cuisine_type: string
  description?: string
  buffer_minutes: number
  district?: string
  operator_phone?: string
}

export default function AdminSettingsPage() {
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null)
  const [form, setForm] = useState<Partial<Restaurant>>({})
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    fetch(`${API}/admin/restaurant`, { headers: authHeader() })
      .then(r => r.json())
      .then(data => {
        const r = Array.isArray(data) ? data[0] : null
        if (r) {
          setRestaurant(r)
          setForm({
            name: r.name,
            address: r.address,
            phone: r.phone || '',
            cuisine_type: r.cuisine_type,
            description: r.description || '',
            buffer_minutes: r.buffer_minutes,
            district: r.district || '',
            operator_phone: r.operator_phone || '',
          })
        }
      })
      .catch(() => {})
  }, [])

  const handleSave = async () => {
    if (!restaurant) return
    setSaving(true)
    setSaved(false)
    try {
      await fetch(`${API}/admin/restaurant/${restaurant.id}`, {
        method: 'PATCH',
        headers: authHeader(),
        body: JSON.stringify(form),
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } finally {
      setSaving(false)
    }
  }

  const set = (key: keyof Restaurant, val: string | number) =>
    setForm(f => ({ ...f, [key]: val }))

  if (!restaurant) return <div style={{ color: 'var(--text-muted)', padding: 48 }}>Загрузка...</div>

  return (
    <div className={styles.card}>
      <div className={styles.section}>
        <div className={styles.sectionTitle}>Основная информация</div>
        <div className={styles.grid}>
          <div className={styles.field}>
            <label>Название *</label>
            <input className={styles.input} value={form.name || ''}
              onChange={e => set('name', e.target.value)} />
          </div>
          <div className={styles.field}>
            <label>Тип кухни</label>
            <input className={styles.input} value={form.cuisine_type || ''}
              onChange={e => set('cuisine_type', e.target.value)} placeholder="Казахская, Европейская..." />
          </div>
          <div className={styles.field}>
            <label>Адрес</label>
            <input className={styles.input} value={form.address || ''}
              onChange={e => set('address', e.target.value)} />
          </div>
          <div className={styles.field}>
            <label>Район</label>
            <input className={styles.input} value={form.district || ''}
              onChange={e => set('district', e.target.value)} placeholder="Алмалинский, Бостандыкский..." />
          </div>
          <div className={`${styles.field} ${styles.fieldFull}`}>
            <label>Описание</label>
            <textarea className={styles.textarea} value={form.description || ''}
              onChange={e => set('description', e.target.value)} />
          </div>
        </div>
      </div>

      <div className={styles.section}>
        <div className={styles.sectionTitle}>Контакты</div>
        <div className={styles.grid}>
          <div className={styles.field}>
            <label>Телефон ресторана</label>
            <input className={styles.input} value={form.phone || ''}
              onChange={e => set('phone', e.target.value)} placeholder="+7 727 000 00 00" />
          </div>
          <div className={styles.field}>
            <label>Телефон оператора (для уведомлений)</label>
            <input className={styles.input} value={form.operator_phone || ''}
              onChange={e => set('operator_phone', e.target.value)} placeholder="+7 777 000 00 00" />
          </div>
        </div>
      </div>

      <div className={styles.section}>
        <div className={styles.sectionTitle}>Настройки броней</div>
        <div className={styles.grid}>
          <div className={styles.field}>
            <label>Буфер между бронями (мин)</label>
            <input className={styles.input} type="number" min={0} max={60} value={form.buffer_minutes || 0}
              onChange={e => set('buffer_minutes', +e.target.value)} />
          </div>
        </div>
      </div>

      <div className={styles.footer}>
        <button className={styles.saveBtn} onClick={handleSave} disabled={saving}>
          {saving ? 'Сохранение...' : 'Сохранить'}
        </button>
        {saved && <span className={styles.savedMsg}>Сохранено</span>}
      </div>
    </div>
  )
}

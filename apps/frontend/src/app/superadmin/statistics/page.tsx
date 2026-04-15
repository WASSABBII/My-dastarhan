'use client'

import { useEffect, useState } from 'react'
import styles from './page.module.css'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3005/api'

function authHeader() {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : ''
  return { Authorization: `Bearer ${token}` }
}

interface PlatformStats {
  restaurants: { total: number; active: number; pending: number }
  bookings: number
  clients: number
}

export default function SuperAdminStatsPage() {
  const [stats, setStats] = useState<PlatformStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`${API}/superadmin/statistics`, { headers: authHeader() })
      .then(r => r.json())
      .then(setStats)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className={styles.loading}>Загрузка...</div>
  if (!stats) return <div className={styles.loading}>Ошибка загрузки</div>

  return (
    <div>
      <h1 className={styles.title}>Статистика платформы</h1>
      <div className={styles.grid}>
        <div className={styles.card}>
          <div className={styles.cardVal}>{stats.restaurants.total}</div>
          <div className={styles.cardLabel}>Всего ресторанов</div>
        </div>
        <div className={styles.card}>
          <div className={`${styles.cardVal} ${styles.green}`}>{stats.restaurants.active}</div>
          <div className={styles.cardLabel}>Активных</div>
        </div>
        <div className={styles.card}>
          <div className={`${styles.cardVal} ${styles.orange}`}>{stats.restaurants.pending}</div>
          <div className={styles.cardLabel}>На проверке</div>
        </div>
        <div className={styles.card}>
          <div className={styles.cardVal}>{stats.bookings.toLocaleString('ru')}</div>
          <div className={styles.cardLabel}>Всего броней</div>
        </div>
        <div className={styles.card}>
          <div className={styles.cardVal}>{stats.clients.toLocaleString('ru')}</div>
          <div className={styles.cardLabel}>Клиентов</div>
        </div>
      </div>
    </div>
  )
}

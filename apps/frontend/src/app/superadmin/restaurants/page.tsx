'use client'

import { useEffect, useState } from 'react'
import styles from './page.module.css'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3005/api'

function authHeader() {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : ''
  return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
}

type RestaurantStatus = 'pending' | 'active' | 'blocked'

interface Restaurant {
  id: string
  name: string
  address: string
  cuisine_type: string
  status: RestaurantStatus
  created_at: string
  slug: string
}

const STATUS_LABEL: Record<RestaurantStatus, string> = {
  pending: 'На проверке',
  active: 'Активен',
  blocked: 'Заблокирован',
}

export default function SuperAdminRestaurantsPage() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([])
  const [filter, setFilter] = useState<RestaurantStatus | 'all'>('all')
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<string | null>(null)

  const load = (status?: RestaurantStatus | 'all') => {
    setLoading(true)
    const q = status && status !== 'all' ? `?status=${status}` : ''
    fetch(`${API}/superadmin/restaurants${q}`, { headers: authHeader() })
      .then(r => r.json())
      .then(data => setRestaurants(data?.data || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => { load(filter) }, [filter])

  const updateStatus = async (id: string, status: RestaurantStatus) => {
    setUpdating(id)
    try {
      await fetch(`${API}/superadmin/restaurants/${id}`, {
        method: 'PATCH',
        headers: authHeader(),
        body: JSON.stringify({ status }),
      })
      setRestaurants(prev => prev.map(r => r.id === id ? { ...r, status } : r))
    } catch {
      alert('Ошибка')
    } finally {
      setUpdating(null)
    }
  }

  return (
    <div>
      <div className={styles.header}>
        <h1 className={styles.title}>Рестораны</h1>
        <p className={styles.sub}>Управление ресторанами платформы</p>
      </div>

      <div className={styles.filters}>
        {(['all', 'pending', 'active', 'blocked'] as const).map(s => (
          <button
            key={s}
            className={`${styles.filterBtn} ${filter === s ? styles.filterActive : ''}`}
            onClick={() => setFilter(s)}
          >
            {s === 'all' ? 'Все' : STATUS_LABEL[s]}
          </button>
        ))}
      </div>

      {loading ? (
        <div className={styles.loading}>Загрузка...</div>
      ) : restaurants.length === 0 ? (
        <div className={styles.empty}>Ресторанов не найдено</div>
      ) : (
        <div className={styles.table}>
          <div className={styles.tableHead}>
            <div>Ресторан</div>
            <div>Кухня</div>
            <div>Статус</div>
            <div>Дата</div>
            <div>Действия</div>
          </div>
          {restaurants.map(r => (
            <div key={r.id} className={styles.tableRow}>
              <div>
                <div className={styles.restName}>{r.name}</div>
                <div className={styles.restAddr}>{r.address}</div>
              </div>
              <div className={styles.cell}>{r.cuisine_type}</div>
              <div>
                <span className={`${styles.badge} ${styles['s_' + r.status]}`}>
                  {STATUS_LABEL[r.status]}
                </span>
              </div>
              <div className={styles.cell}>
                {new Date(r.created_at).toLocaleDateString('ru-RU')}
              </div>
              <div className={styles.actions}>
                {r.status === 'pending' && (
                  <button
                    className={styles.approveBtn}
                    onClick={() => updateStatus(r.id, 'active')}
                    disabled={updating === r.id}
                  >
                    Одобрить
                  </button>
                )}
                {r.status === 'active' && (
                  <button
                    className={styles.blockBtn}
                    onClick={() => updateStatus(r.id, 'blocked')}
                    disabled={updating === r.id}
                  >
                    Заблокировать
                  </button>
                )}
                {r.status === 'blocked' && (
                  <button
                    className={styles.approveBtn}
                    onClick={() => updateStatus(r.id, 'active')}
                    disabled={updating === r.id}
                  >
                    Разблокировать
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

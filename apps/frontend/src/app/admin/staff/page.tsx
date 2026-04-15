'use client'

import { useEffect, useState } from 'react'
import styles from './page.module.css'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3005/api'

function authHeader() {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : ''
  return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
}

interface StaffMember {
  linkId: string
  role: string
  user: { id: string; email: string; role: string; created_at: string }
}

export default function AdminStaffPage() {
  const [staff, setStaff] = useState<StaffMember[]>([])
  const [restaurantId, setRestaurantId] = useState('')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(true)
  const [inviting, setInviting] = useState(false)
  const [showInvite, setShowInvite] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    const loadStaff = (rid: string) => {
      setRestaurantId(rid)
      fetch(`${API}/admin/staff?restaurantId=${rid}`, { headers: authHeader() })
        .then(r => r.json())
        .then(s => setStaff(Array.isArray(s) ? s : []))
        .catch(() => {})
        .finally(() => setLoading(false))
    }

    const saved = localStorage.getItem('activeRestaurantId')
    if (saved) { loadStaff(saved); return }

    fetch(`${API}/admin/restaurant`, { headers: authHeader() })
      .then(r => r.json())
      .then(data => {
        const list = Array.isArray(data) ? data : []
        if (list[0]) loadStaff(list[0].id)
        else setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const handleInvite = async () => {
    if (!email.trim()) { setError('Введите email'); return }
    setInviting(true)
    setError('')
    setSuccess('')
    try {
      const res = await fetch(`${API}/admin/staff/invite?restaurantId=${restaurantId}`, {
        method: 'POST',
        headers: authHeader(),
        body: JSON.stringify({ email: email.trim() }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Ошибка')
      setStaff(prev => [...prev, { linkId: data.id, role: 'staff', user: data }])
      setEmail('')
      setShowInvite(false)
      setSuccess(`Сотрудник ${email} добавлен. Временный пароль отправлен на email.`)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Ошибка')
    } finally {
      setInviting(false)
    }
  }

  const handleRemove = async (userId: string, userEmail: string) => {
    if (!confirm(`Удалить ${userEmail} из ресторана?`)) return
    try {
      await fetch(`${API}/admin/staff/${userId}?restaurantId=${restaurantId}`, {
        method: 'DELETE',
        headers: authHeader(),
      })
      setStaff(prev => prev.filter(s => s.user.id !== userId))
    } catch {
      alert('Ошибка при удалении')
    }
  }

  return (
    <div>
      <div className={styles.header}>
        <div>
          <h2 className={styles.pageTitle}>Сотрудники</h2>
          <p className={styles.pageSub}>Управление командой ресторана</p>
        </div>
        <button className={styles.inviteBtn} onClick={() => { setShowInvite(true); setError(''); setSuccess('') }}>
          + Пригласить
        </button>
      </div>

      {success && <div className={styles.success}>{success}</div>}

      {showInvite && (
        <div className={styles.inviteCard}>
          <div className={styles.inviteTitle}>Пригласить сотрудника</div>
          <div className={styles.inviteRow}>
            <input
              className={styles.input}
              type="email"
              placeholder="email@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleInvite()}
              autoFocus
            />
            <button className={styles.sendBtn} onClick={handleInvite} disabled={inviting}>
              {inviting ? 'Отправляем...' : 'Отправить'}
            </button>
            <button className={styles.cancelInviteBtn} onClick={() => setShowInvite(false)}>
              Отмена
            </button>
          </div>
          {error && <div className={styles.error}>{error}</div>}
          <p className={styles.inviteHint}>
            Сотруднику будет создан аккаунт с временным паролем, который придёт на email.
          </p>
        </div>
      )}

      {loading ? (
        <div className={styles.loading}>Загрузка...</div>
      ) : staff.length === 0 ? (
        <div className={styles.empty}>
          <div className={styles.emptyTitle}>Сотрудников нет</div>
          <div className={styles.emptySub}>Пригласите первого сотрудника по email</div>
        </div>
      ) : (
        <div className={styles.table}>
          <div className={styles.tableHead}>
            <div>Email</div>
            <div>Роль</div>
            <div>Добавлен</div>
            <div></div>
          </div>
          {staff.map(s => (
            <div key={s.user.id} className={styles.tableRow}>
              <div className={styles.email}>{s.user.email}</div>
              <div>
                <span className={`${styles.roleBadge} ${s.role === 'owner' ? styles.roleOwner : styles.roleStaff}`}>
                  {s.role === 'owner' ? 'Владелец' : 'Сотрудник'}
                </span>
              </div>
              <div className={styles.dateCell}>
                {new Date(s.user.created_at).toLocaleDateString('ru-RU')}
              </div>
              <div>
                {s.role !== 'owner' && (
                  <button
                    className={styles.removeBtn}
                    onClick={() => handleRemove(s.user.id, s.user.email)}
                  >
                    Удалить
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

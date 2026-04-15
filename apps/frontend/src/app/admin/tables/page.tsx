'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import dynamic from 'next/dynamic'
import styles from './page.module.css'

const FloorPlanEditor = dynamic(() => import('@/components/floor-plan/FloorPlanEditor'), { ssr: false })

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3005/api'

interface Table {
  id: string
  label: string
  capacity: number
  location_tag?: string
  shape: 'round' | 'square' | 'rectangle'
  pos_x: number
  pos_y: number
  is_active: boolean
}

function authHeader() {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : ''
  return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
}

const emptyForm = { label: '', capacity: 2, location_tag: '', shape: 'square' as 'round' | 'square' | 'rectangle', is_active: true }

export default function AdminTablesPage() {
  const [tables, setTables] = useState<Table[]>([])
  const [restaurantId, setRestaurantId] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'list' | 'plan'>('list')
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Table | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [qrTable, setQrTable] = useState<Table | null>(null)

  useEffect(() => {
    const saved = localStorage.getItem('activeRestaurantId')
    if (saved) { setRestaurantId(saved); return }
    fetch(`${API}/admin/restaurant`, { headers: authHeader() })
      .then(r => r.json())
      .then(data => {
        const list = Array.isArray(data) ? data : []
        if (list[0]?.id) setRestaurantId(list[0].id)
      })
      .catch(() => {})
  }, [])

  const load = useCallback(() => {
    if (!restaurantId) return
    fetch(`${API}/admin/tables?restaurantId=${restaurantId}`, { headers: authHeader() })
      .then(r => r.json())
      .then(data => setTables(Array.isArray(data) ? data : []))
      .catch(() => {})
  }, [restaurantId])

  useEffect(() => { load() }, [load])

  const openAdd = () => {
    setEditing(null)
    setForm(emptyForm)
    setShowForm(true)
  }

  const openEdit = (t: Table) => {
    setEditing(t)
    setForm({ label: t.label, capacity: t.capacity, location_tag: t.location_tag || '', shape: t.shape, is_active: t.is_active })
    setShowForm(true)
  }

  const handleSave = async () => {
    if (!form.label.trim() || !restaurantId) return
    if (editing) {
      const body = { label: form.label, capacity: Number(form.capacity), location_tag: form.location_tag, shape: form.shape, is_active: form.is_active }
      await fetch(`${API}/admin/tables/${editing.id}`, {
        method: 'PATCH',
        headers: authHeader(),
        body: JSON.stringify(body),
      })
    } else {
      const body = { label: form.label, capacity: Number(form.capacity), location_tag: form.location_tag, shape: form.shape, restaurant_id: restaurantId }
      await fetch(`${API}/admin/tables`, {
        method: 'POST',
        headers: authHeader(),
        body: JSON.stringify(body),
      })
    }
    setShowForm(false)
    load()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Удалить столик?')) return
    await fetch(`${API}/admin/tables/${id}`, { method: 'DELETE', headers: authHeader() })
    load()
  }

  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null)
  const qrBlobUrl = useRef('')

  useEffect(() => {
    if (!qrTable) { setQrDataUrl(null); return }
    const token = localStorage.getItem('token') || ''
    fetch(`${API}/admin/tables/${qrTable.id}/qr`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.blob())
      .then(blob => {
        qrBlobUrl.current = URL.createObjectURL(blob)
        setQrDataUrl(qrBlobUrl.current)
      })
      .catch(() => {})
    return () => { if (qrBlobUrl.current) { URL.revokeObjectURL(qrBlobUrl.current); qrBlobUrl.current = '' } }
  }, [qrTable])

  return (
    <div>
      {qrTable && (
        <div className={styles.modalOverlay} onClick={() => setQrTable(null)}>
          <div className={styles.modalBox} onClick={e => e.stopPropagation()}>
            <div className={styles.modalTitle}>QR-код: {qrTable.label}</div>
            {qrDataUrl
              ? <img src={qrDataUrl} alt="QR" className={styles.qrImg} />
              : <div className={styles.qrImg} style={{ display:'flex', alignItems:'center', justifyContent:'center', color:'var(--text-sec)' }}>Загрузка...</div>
            }
            <div className={styles.modalActions}>
              {qrDataUrl && (
                <a className={styles.downloadBtn} href={qrDataUrl} download={`qr-${qrTable.label}.png`}>
                  Скачать PNG
                </a>
              )}
              <button className={styles.cancelFormBtn} onClick={() => setQrTable(null)}>Закрыть</button>
            </div>
          </div>
        </div>
      )}

      <div className={styles.header}>
        <div className={styles.viewToggle}>
          <button
            className={`${styles.viewBtn} ${viewMode === 'list' ? styles.viewActive : ''}`}
            onClick={() => setViewMode('list')}
          >
            Список
          </button>
          <button
            className={`${styles.viewBtn} ${viewMode === 'plan' ? styles.viewActive : ''}`}
            onClick={() => setViewMode('plan')}
          >
            План зала
          </button>
        </div>
        {viewMode === 'list' && (
          <button className={styles.addBtn} onClick={openAdd}>+ Добавить столик</button>
        )}
      </div>

      {showForm && (
        <div className={styles.formCard}>
          <div className={styles.formTitle}>{editing ? 'Редактировать столик' : 'Новый столик'}</div>
          <div className={styles.formGrid}>
            <div className={styles.field}>
              <label>Название *</label>
              <input className={styles.input} placeholder="Стол 1" value={form.label}
                onChange={e => setForm(f => ({ ...f, label: e.target.value }))} />
            </div>
            <div className={styles.field}>
              <label>Мест</label>
              <input className={styles.input} type="number" min={1} max={30} value={form.capacity}
                onChange={e => setForm(f => ({ ...f, capacity: +e.target.value }))} />
            </div>
            <div className={styles.field}>
              <label>Зона</label>
              <input className={styles.input} placeholder="Терраса, VIP..." value={form.location_tag}
                onChange={e => setForm(f => ({ ...f, location_tag: e.target.value }))} />
            </div>
            <div className={styles.field}>
              <label>Форма</label>
              <select className={styles.select} value={form.shape}
                onChange={e => setForm(f => ({ ...f, shape: e.target.value as typeof form.shape }))}>
                <option value="square">Квадрат</option>
                <option value="round">Круг</option>
                <option value="rectangle">Прямоугольник</option>
              </select>
            </div>
            <div className={styles.field}>
              <label>Статус</label>
              <select className={styles.select} value={form.is_active ? 'true' : 'false'}
                onChange={e => setForm(f => ({ ...f, is_active: e.target.value === 'true' }))}>
                <option value="true">Активен</option>
                <option value="false">Неактивен</option>
              </select>
            </div>
          </div>
          <div className={styles.formActions}>
            <button className={styles.saveBtn} onClick={handleSave}>Сохранить</button>
            <button className={styles.cancelFormBtn} onClick={() => setShowForm(false)}>Отмена</button>
          </div>
        </div>
      )}

      {viewMode === 'plan' && (
        <FloorPlanEditor tables={tables} onSaved={load} />
      )}

      {viewMode === 'list' && <div className={styles.tableWrap}>
        {tables.length === 0 ? (
          <div className={styles.empty}>Столиков нет. Добавьте первый.</div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Название</th>
                <th>Мест</th>
                <th>Зона</th>
                <th>Форма</th>
                <th>Статус</th>
                <th>Действия</th>
              </tr>
            </thead>
            <tbody>
              {tables.map(t => (
                <tr key={t.id}>
                  <td className={styles.tdLabel}>{t.label}</td>
                  <td>{t.capacity}</td>
                  <td>{t.location_tag || '—'}</td>
                  <td>{t.shape === 'round' ? 'Круг' : t.shape === 'rectangle' ? 'Прямоугольник' : 'Квадрат'}</td>
                  <td>
                    <span className={`${styles.badge} ${t.is_active ? styles.badgeActive : styles.badgeInactive}`}>
                      {t.is_active ? 'Активен' : 'Неактивен'}
                    </span>
                  </td>
                  <td>
                    <button className={styles.iconBtn} onClick={() => setQrTable(t)}>QR</button>
                    <button className={styles.iconBtn} onClick={() => openEdit(t)}>Изменить</button>
                    <button className={`${styles.iconBtn} ${styles.iconBtnDanger}`} onClick={() => handleDelete(t.id)}>Удалить</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>}
    </div>
  )
}

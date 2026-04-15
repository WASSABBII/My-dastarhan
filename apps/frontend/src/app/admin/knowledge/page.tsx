'use client'

import { useEffect, useState } from 'react'
import styles from './page.module.css'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3005/api'

function authHeader() {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : ''
  return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
}

type Category = 'faq' | 'contacts' | 'promo'

const CAT_LABELS: Record<Category, string> = {
  faq: 'Часто задаваемые вопросы',
  contacts: 'Контакты и адрес',
  promo: 'Акции и спецпредложения',
}

interface KnowledgeItem {
  id: string
  category: Category
  title: string
  content: string
}

const EMPTY_FORM = { category: 'faq' as Category, title: '', content: '' }

export default function AdminKnowledgePage() {
  const [items, setItems] = useState<KnowledgeItem[]>([])
  const [restaurantId, setRestaurantId] = useState('')
  const [filterCat, setFilterCat] = useState<Category | 'all'>('all')
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editItem, setEditItem] = useState<KnowledgeItem | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const loadItems = (rid: string) => {
      setRestaurantId(rid)
      fetch(`${API}/admin/knowledge?restaurantId=${rid}`, { headers: authHeader() })
        .then(r => r.json())
        .then(d => setItems(Array.isArray(d) ? d : []))
        .catch(() => {})
        .finally(() => setLoading(false))
    }

    const saved = localStorage.getItem('activeRestaurantId')
    if (saved) { loadItems(saved); return }

    fetch(`${API}/admin/restaurant`, { headers: authHeader() })
      .then(r => r.json())
      .then(data => {
        const list = Array.isArray(data) ? data : []
        if (list[0]) loadItems(list[0].id)
        else setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const filtered = filterCat === 'all' ? items : items.filter(i => i.category === filterCat)

  const openCreate = () => {
    setEditItem(null)
    setForm(EMPTY_FORM)
    setShowForm(true)
  }

  const openEdit = (item: KnowledgeItem) => {
    setEditItem(item)
    setForm({ category: item.category, title: item.title, content: item.content })
    setShowForm(true)
  }

  const handleSave = async () => {
    if (!form.title.trim() || !form.content.trim()) return
    setSaving(true)
    try {
      if (editItem) {
        const res = await fetch(`${API}/admin/knowledge/${editItem.id}`, {
          method: 'PATCH',
          headers: authHeader(),
          body: JSON.stringify(form),
        })
        const updated = await res.json()
        setItems(prev => prev.map(i => i.id === editItem.id ? updated : i))
      } else {
        const res = await fetch(`${API}/admin/knowledge`, {
          method: 'POST',
          headers: authHeader(),
          body: JSON.stringify({ ...form, restaurant_id: restaurantId }),
        })
        const created = await res.json()
        setItems(prev => [...prev, created])
      }
      setShowForm(false)
    } catch {
      alert('Ошибка при сохранении')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Удалить запись?')) return
    const res = await fetch(`${API}/admin/knowledge/${id}`, { method: 'DELETE', headers: authHeader() })
    if (res.ok) setItems(prev => prev.filter(i => i.id !== id))
    else alert('Ошибка при удалении')
  }

  return (
    <div>
      <div className={styles.header}>
        <div>
          <h2 className={styles.pageTitle}>База знаний</h2>
          <p className={styles.pageSub}>Информация для AI-консьержа ресторана</p>
        </div>
        <button className={styles.addBtn} onClick={openCreate}>+ Добавить</button>
      </div>

      <div className={styles.filters}>
        {(['all', 'faq', 'contacts', 'promo'] as const).map(cat => (
          <button
            key={cat}
            className={`${styles.filterBtn} ${filterCat === cat ? styles.filterActive : ''}`}
            onClick={() => setFilterCat(cat)}
          >
            {cat === 'all' ? 'Все' : CAT_LABELS[cat]}
          </button>
        ))}
      </div>

      {showForm && (
        <div className={styles.formCard}>
          <div className={styles.formTitle}>{editItem ? 'Редактировать' : 'Новая запись'}</div>
          <div className={styles.formGrid}>
            <div className={styles.field}>
              <label className={styles.label}>Категория</label>
              <select
                className={styles.select}
                value={form.category}
                onChange={e => setForm(f => ({ ...f, category: e.target.value as Category }))}
              >
                {(Object.entries(CAT_LABELS) as [Category, string][]).map(([v, l]) => (
                  <option key={v} value={v}>{l}</option>
                ))}
              </select>
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Заголовок</label>
              <input
                className={styles.input}
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                placeholder="Например: Как забронировать столик?"
              />
            </div>
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Содержимое</label>
            <textarea
              className={styles.textarea}
              value={form.content}
              onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
              placeholder="Подробный ответ или информация..."
              rows={4}
            />
          </div>
          <div className={styles.formActions}>
            <button className={styles.saveBtn} onClick={handleSave} disabled={saving}>
              {saving ? 'Сохраняем...' : 'Сохранить'}
            </button>
            <button className={styles.cancelBtn} onClick={() => setShowForm(false)}>Отмена</button>
          </div>
        </div>
      )}

      {loading ? (
        <div className={styles.loading}>Загрузка...</div>
      ) : filtered.length === 0 ? (
        <div className={styles.empty}>
          <div className={styles.emptyTitle}>Записей нет</div>
          <div className={styles.emptySub}>
            Добавьте FAQ, контакты или акции — AI-консьерж будет использовать эти данные для ответов
          </div>
        </div>
      ) : (
        <div className={styles.list}>
          {filtered.map(item => (
            <div key={item.id} className={styles.item}>
              <div className={styles.itemLeft}>
                <span className={`${styles.catBadge} ${styles['cat_' + item.category]}`}>
                  {CAT_LABELS[item.category]}
                </span>
                <div className={styles.itemTitle}>{item.title}</div>
                <div className={styles.itemContent}>{item.content}</div>
              </div>
              <div className={styles.itemActions}>
                <button className={styles.editBtn} onClick={() => openEdit(item)}>Изменить</button>
                <button className={styles.deleteBtn} onClick={() => handleDelete(item.id)}>Удалить</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

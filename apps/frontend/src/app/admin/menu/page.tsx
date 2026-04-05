'use client'

import { useEffect, useState, useCallback } from 'react'
import styles from './page.module.css'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3005/api'

interface MenuItem {
  id: string
  name: string
  description?: string
  price: number
  is_available: boolean
}

interface MenuCategory {
  id: string
  name: string
  sort_order: number
  is_active: boolean
  items?: MenuItem[]
}

function authHeader() {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : ''
  return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
}

type FormMode = { type: 'category'; data?: MenuCategory } | { type: 'item'; categoryId: string; data?: MenuItem } | null

export default function AdminMenuPage() {
  const [categories, setCategories] = useState<MenuCategory[]>([])
  const [restaurantId, setRestaurantId] = useState<string | null>(null)
  const [formMode, setFormMode] = useState<FormMode>(null)
  const [formData, setFormData] = useState<Record<string, string>>({})

  useEffect(() => {
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
    fetch(`${API}/admin/menu?restaurantId=${restaurantId}`, { headers: authHeader() })
      .then(r => r.json())
      .then(data => setCategories(Array.isArray(data) ? data : []))
      .catch(() => {})
  }, [restaurantId])

  useEffect(() => { load() }, [load])

  const openCatForm = (cat?: MenuCategory) => {
    setFormMode({ type: 'category', data: cat })
    setFormData({ name: cat?.name || '', sort_order: String(cat?.sort_order ?? 0) })
  }

  const openItemForm = (categoryId: string, item?: MenuItem) => {
    setFormMode({ type: 'item', categoryId, data: item })
    setFormData({
      name: item?.name || '',
      description: item?.description || '',
      price: String(item?.price || ''),
      is_available: String(item?.is_available ?? true),
    })
  }

  const handleSave = async () => {
    if (!formMode || !restaurantId) return

    if (formMode.type === 'category') {
      const body = { name: formData.name, sort_order: Number(formData.sort_order), restaurant_id: restaurantId }
      if (formMode.data) {
        await fetch(`${API}/admin/menu/categories/${formMode.data.id}`, {
          method: 'PATCH', headers: authHeader(), body: JSON.stringify(body),
        })
      } else {
        await fetch(`${API}/admin/menu/categories`, {
          method: 'POST', headers: authHeader(), body: JSON.stringify(body),
        })
      }
    } else {
      if (formMode.data) {
        const body = { name: formData.name, description: formData.description, price: Number(formData.price), is_available: formData.is_available === 'true' }
        await fetch(`${API}/admin/menu/items/${formMode.data.id}`, {
          method: 'PATCH', headers: authHeader(), body: JSON.stringify(body),
        })
      } else {
        const body = { name: formData.name, description: formData.description, price: Number(formData.price), category_id: formMode.categoryId, restaurant_id: restaurantId }
        await fetch(`${API}/admin/menu/items`, {
          method: 'POST', headers: authHeader(), body: JSON.stringify(body),
        })
      }
    }
    setFormMode(null)
    load()
  }

  const deleteCat = async (id: string) => {
    if (!confirm('Удалить категорию и все блюда?')) return
    await fetch(`${API}/admin/menu/categories/${id}`, { method: 'DELETE', headers: authHeader() })
    load()
  }

  const deleteItem = async (id: string) => {
    if (!confirm('Удалить блюдо?')) return
    await fetch(`${API}/admin/menu/items/${id}`, { method: 'DELETE', headers: authHeader() })
    load()
  }

  return (
    <div>
      <div className={styles.header}>
        <div />
        <button className={styles.addCatBtn} onClick={() => openCatForm()}>+ Категория</button>
      </div>

      {formMode && (
        <div className={styles.formCard}>
          <div className={styles.formTitle}>
            {formMode.type === 'category'
              ? (formMode.data ? 'Редактировать категорию' : 'Новая категория')
              : (formMode.data ? 'Редактировать блюдо' : 'Новое блюдо')}
          </div>
          {formMode.type === 'category' ? (
            <div className={styles.formRow}>
              <div className={styles.field}>
                <label>Название *</label>
                <input className={styles.input} value={formData.name}
                  onChange={e => setFormData(f => ({ ...f, name: e.target.value }))} />
              </div>
              <div className={styles.field}>
                <label>Порядок</label>
                <input className={styles.input} type="number" value={formData.sort_order}
                  onChange={e => setFormData(f => ({ ...f, sort_order: e.target.value }))} />
              </div>
            </div>
          ) : (
            <>
              <div className={styles.formRow}>
                <div className={styles.field}>
                  <label>Название *</label>
                  <input className={styles.input} value={formData.name}
                    onChange={e => setFormData(f => ({ ...f, name: e.target.value }))} />
                </div>
                <div className={styles.field}>
                  <label>Цена (₸) *</label>
                  <input className={styles.input} type="number" value={formData.price}
                    onChange={e => setFormData(f => ({ ...f, price: e.target.value }))} />
                </div>
                <div className={styles.field}>
                  <label>Доступность</label>
                  <select className={styles.select} value={formData.is_available}
                    onChange={e => setFormData(f => ({ ...f, is_available: e.target.value }))}>
                    <option value="true">Доступно</option>
                    <option value="false">Недоступно</option>
                  </select>
                </div>
              </div>
              <div className={styles.field} style={{ marginBottom: 16 }}>
                <label>Описание</label>
                <textarea className={styles.textarea} value={formData.description}
                  onChange={e => setFormData(f => ({ ...f, description: e.target.value }))} />
              </div>
            </>
          )}
          <div className={styles.formActions}>
            <button className={styles.saveBtn} onClick={handleSave}>Сохранить</button>
            <button className={styles.cancelBtn} onClick={() => setFormMode(null)}>Отмена</button>
          </div>
        </div>
      )}

      {categories.length === 0 ? (
        <div className={styles.empty}>Меню пустое. Добавьте первую категорию.</div>
      ) : (
        categories.map(cat => (
          <div key={cat.id} className={styles.category}>
            <div className={styles.catHeader}>
              <div className={styles.catName}>{cat.name}</div>
              <div className={styles.catActions}>
                <button className={styles.addItemBtn} onClick={() => openItemForm(cat.id)}>+ Блюдо</button>
                <button className={styles.iconBtn} onClick={() => openCatForm(cat)}>Изменить</button>
                <button className={`${styles.iconBtn} ${styles.iconBtnDanger}`} onClick={() => deleteCat(cat.id)}>Удалить</button>
              </div>
            </div>
            <div className={styles.items}>
              {!cat.items || cat.items.length === 0 ? (
                <div className={styles.emptyItems}>Нет блюд</div>
              ) : (
                cat.items.map(item => (
                  <div key={item.id} className={styles.item}>
                    <div className={styles.itemInfo}>
                      <div className={styles.itemName}>
                        {item.name}
                        <span className={`${styles.itemBadge} ${item.is_available ? styles.itemAvail : styles.itemUnavail}`}>
                          {item.is_available ? 'В меню' : 'Нет'}
                        </span>
                      </div>
                      <div className={styles.itemPrice}>{Number(item.price).toLocaleString()} ₸</div>
                      {item.description && <div className={styles.itemDesc}>{item.description}</div>}
                    </div>
                    <div className={styles.itemActions}>
                      <button className={styles.iconBtn} onClick={() => openItemForm(cat.id, item)}>Изм.</button>
                      <button className={`${styles.iconBtn} ${styles.iconBtnDanger}`} onClick={() => deleteItem(item.id)}>Удал.</button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        ))
      )}
    </div>
  )
}

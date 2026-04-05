'use client'
import styles from './CatalogFilters.module.css'
import type { CatalogFilters as Filters } from '@/lib/catalog'

const CUISINES = ['', 'Казахская', 'Японская', 'Европейская', 'Итальянская', 'Китайская', 'Грузинская']

interface CatalogFiltersProps {
  filters: Filters
  onChange: (filters: Filters) => void
}

export default function CatalogFilters({ filters, onChange }: CatalogFiltersProps) {
  const guestOptions = [1, 2, 3, 4, 5]

  return (
    <div className={styles.filters}>
      <h3 className={styles.title}>Фильтры</h3>

      <div className={styles.group}>
        <label className={styles.label}>Дата</label>
        <input
          type="date"
          className={styles.input}
          value={filters.date || ''}
          min={new Date().toISOString().split('T')[0]}
          onChange={e => onChange({ ...filters, date: e.target.value })}
        />
      </div>

      <div className={styles.group}>
        <label className={styles.label}>Время</label>
        <input
          type="time"
          className={styles.input}
          value={filters.time || ''}
          onChange={e => onChange({ ...filters, time: e.target.value })}
        />
      </div>

      <div className={styles.group}>
        <label className={styles.label}>Гостей</label>
        <div className={styles.guestBtns}>
          {guestOptions.map(n => (
            <button
              key={n}
              type="button"
              className={`${styles.guestBtn} ${filters.guests === n ? styles.active : ''}`}
              onClick={() => onChange({ ...filters, guests: n })}
            >{n}</button>
          ))}
          <button
            type="button"
            className={`${styles.guestBtn} ${(filters.guests || 0) > 5 ? styles.active : ''}`}
            onClick={() => onChange({ ...filters, guests: 6 })}
          >5+</button>
        </div>
      </div>

      <div className={styles.group}>
        <label className={styles.label}>Кухня</label>
        <select
          className={styles.select}
          value={filters.cuisine || ''}
          onChange={e => onChange({ ...filters, cuisine: e.target.value || undefined })}
        >
          <option value="">Все кухни</option>
          {CUISINES.filter(Boolean).map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      <button
        type="button"
        className={styles.resetBtn}
        onClick={() => onChange({})}
      >Сбросить фильтры</button>
    </div>
  )
}

'use client'
import { useBookingStore } from '@/store/booking.store'
import FloorPlan from '@/components/floor-plan/FloorPlan'
import styles from './Step1.module.css'

function formatDate(dateStr: string) {
  if (!dateStr) return ''
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })
}

export default function Step1() {
  const store = useBookingStore()

  const handleTableClick = (tableId: string) => {
    store.toggleTable(tableId)
  }

  const canProceed = store.selectedTableIds.length > 0 && !!store.restaurant && !!store.date && !!store.time
  const selectedCount = store.selectedTableIds.length

  if (!store.restaurant) {
    return (
      <div className={styles.noRestaurant}>
        <p>Сначала выберите ресторан в <a href="/catalog">каталоге</a>.</p>
      </div>
    )
  }

  return (
    <div className={styles.step}>

      {/* ── Top header card: info + navigation ── */}
      <div className={styles.headerCard}>
        <div className={styles.headerTop}>
          {/* Restaurant name + back */}
          <div className={styles.headerLeft}>
            <a href={`/${store.restaurant.slug}`} className={styles.backBtn}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="19" y1="12" x2="5" y2="12" />
                <polyline points="12 19 5 12 12 5" />
              </svg>
              Назад
            </a>
            <h2 className={styles.restaurantName}>{store.restaurant.name}</h2>
          </div>

          {/* Next button */}
          <button
            className={`${styles.nextBtn} ${canProceed ? styles.nextBtnActive : ''}`}
            disabled={!canProceed}
            onClick={() => store.setStep(2)}
          >
            {canProceed ? (
              <>
                Далее
                <span className={styles.nextBadge}>{selectedCount}</span>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </>
            ) : (
              <>
                Выберите стол
              </>
            )}
          </button>
        </div>

        {/* Details row */}
        <div className={styles.detailsRow}>
          <div className={styles.detailChip}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            {formatDate(store.date)}
          </div>
          <div className={styles.detailChip}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
            </svg>
            {store.time}
          </div>
          <div className={styles.detailChip}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
            {store.guests} {store.guests === 1 ? 'гость' : store.guests < 5 ? 'гостя' : 'гостей'}
          </div>

          {selectedCount > 0 && (
            <div className={styles.selectedChip}>
              <span className={styles.selectedDot} />
              Выбрано: {selectedCount} {selectedCount === 1 ? 'столик' : 'столика'}
            </div>
          )}
        </div>
      </div>

      {/* ── Floor plan ── */}
      {store.availability.length > 0 ? (
        <FloorPlan
          tables={store.availability}
          selectedTableIds={store.selectedTableIds}
          onTableClick={handleTableClick}
          restaurantId={store.restaurant.id}
          date={store.date}
        />
      ) : (
        <div className={styles.noTables}>
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <p>Нет доступных столиков на выбранное время.</p>
          <a href={`/${store.restaurant.slug}`} className={styles.backLink}>← Вернуться к ресторану</a>
        </div>
      )}
    </div>
  )
}

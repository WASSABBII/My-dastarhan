'use client'
import { useBookingStore } from '@/store/booking.store'
import FloorPlan from '@/components/floor-plan/FloorPlan'
import styles from './Step1.module.css'

export default function Step1() {
  const store = useBookingStore()

  const handleTableClick = (tableId: string) => {
    store.toggleTable(tableId)
  }

  const canProceed = store.selectedTableIds.length > 0 && !!store.restaurant && !!store.date && !!store.time

  if (!store.restaurant) {
    return (
      <div className={styles.noRestaurant}>
        <p>Сначала выберите ресторан в <a href="/catalog">каталоге</a>.</p>
      </div>
    )
  }

  return (
    <div className={styles.step}>
      <div className={styles.info}>
        <h2 className={styles.restaurantName}>{store.restaurant.name}</h2>
        <div className={styles.details}>
          <span>📅 {store.date}</span>
          <span>🕐 {store.time}</span>
          <span>👥 {store.guests} гостей</span>
        </div>
      </div>

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
          <p>Нет доступных столиков для выбранного времени.</p>
          <a href={`/${store.restaurant.slug}`} className={styles.backLink}>
            ← Вернуться к ресторану
          </a>
        </div>
      )}

      <div className={styles.actions}>
        <a href={`/${store.restaurant.slug}`} className={styles.backBtn}>← Назад</a>
        <button
          className={styles.nextBtn}
          disabled={!canProceed}
          onClick={() => store.setStep(2)}
        >
          Далее → ({store.selectedTableIds.length} {store.selectedTableIds.length === 1 ? 'столик' : 'столика'})
        </button>
      </div>
    </div>
  )
}

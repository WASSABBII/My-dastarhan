import styles from './RestaurantTabs.module.css'

type TabId = 'about' | 'menu' | 'booking' | 'reviews'
interface Tab { id: TabId; label: string }

const TABS: Tab[] = [
  { id: 'about', label: 'О ресторане' },
  { id: 'menu', label: 'Меню' },
  { id: 'booking', label: 'Бронирование' },
  { id: 'reviews', label: 'Отзывы' },
]

interface RestaurantTabsProps {
  activeTab: TabId
  onChange: (tab: TabId) => void
}

export default function RestaurantTabs({ activeTab, onChange }: RestaurantTabsProps) {
  return (
    <div className={styles.tabs}>
      {TABS.map(tab => (
        <button
          key={tab.id}
          className={`${styles.tab} ${activeTab === tab.id ? styles.active : ''}`}
          onClick={() => onChange(tab.id)}
        >{tab.label}</button>
      ))}
    </div>
  )
}

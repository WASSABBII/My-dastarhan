import type { MenuCategory } from '@/types/api.types'
import styles from './MenuTab.module.css'

interface MenuTabProps {
  categories: MenuCategory[]
}

export default function MenuTab({ categories }: MenuTabProps) {
  if (categories.length === 0) {
    return <div className={styles.empty}>Меню не добавлено</div>
  }

  return (
    <div className={styles.menu}>
      {categories.map(cat => (
        <div key={cat.id} id={`cat-${cat.id}`} className={styles.category}>
          <h2 className={styles.catName}>{cat.name}</h2>
          <div className={styles.items}>
            {cat.items.map(item => (
              <div key={item.id} className={styles.item}>
                {item.photo_url && (
                  <img src={item.photo_url} alt={item.name} className={styles.itemPhoto} />
                )}
                <div className={styles.itemBody}>
                  <h3 className={styles.itemName}>{item.name}</h3>
                  {item.description && <p className={styles.itemDesc}>{item.description}</p>}
                  {item.allergens && item.allergens.length > 0 && (
                    <p className={styles.allergens}>⚠️ {item.allergens.join(', ')}</p>
                  )}
                  <span className={styles.price}>{Number(item.price).toLocaleString('ru-RU')} ₸</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

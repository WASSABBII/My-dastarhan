import type { Restaurant, RestaurantPhoto } from '@/types/api.types'
import styles from './RestaurantHero.module.css'

interface RestaurantHeroProps {
  restaurant: Restaurant
  photos: RestaurantPhoto[]
}

export default function RestaurantHero({ restaurant, photos }: RestaurantHeroProps) {
  const coverUrl = photos[0]?.url || restaurant.cover_photo_url

  return (
    <div className={styles.hero}>
      {coverUrl ? (
        <img src={coverUrl} alt={restaurant.name} className={styles.image} />
      ) : (
        <div className={styles.gradient}>
          <span className={styles.emoji}>🍽️</span>
        </div>
      )}
      <div className={styles.overlay}>
        <div className={styles.content}>
          <span className={styles.cuisine}>{restaurant.cuisine_type}</span>
          <h1 className={styles.name}>{restaurant.name}</h1>
          {restaurant.address && <p className={styles.address}>📍 {restaurant.address}</p>}
        </div>
      </div>
    </div>
  )
}

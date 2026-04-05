'use client'
import Link from 'next/link'
import styles from './RestaurantCard.module.css'
import type { Restaurant } from '@/types/api.types'

const GRADIENTS = [
  'linear-gradient(135deg, #fbbf24, #f59e0b)',
  'linear-gradient(135deg, #e63922, #dc2626)',
  'linear-gradient(135deg, #10b981, #059669)',
  'linear-gradient(135deg, #6366f1, #4f46e5)',
  'linear-gradient(135deg, #f97316, #ea580c)',
  'linear-gradient(135deg, #8b5cf6, #7c3aed)',
]

const EMOJIS = ['🍽️', '🥘', '🍜', '🥗', '🍣', '🍕']

interface RestaurantCardProps {
  restaurant: Restaurant
  date?: string
  time?: string
  index?: number
}

export default function RestaurantCard({ restaurant, date, time, index = 0 }: RestaurantCardProps) {
  const gradient = GRADIENTS[index % GRADIENTS.length]
  const emoji = EMOJIS[index % EMOJIS.length]
  const href = `/${restaurant.slug}${date ? `?date=${date}&time=${time || ''}` : ''}`

  return (
    <Link href={href} className={styles.card}>
      <div className={styles.image} style={{ background: restaurant.cover_photo_url ? undefined : gradient }}>
        {restaurant.cover_photo_url
          ? <img src={restaurant.cover_photo_url} alt={restaurant.name} className={styles.photo} />
          : <span className={styles.emoji}>{emoji}</span>
        }
        <span className={`${styles.badge} ${styles.free}`}>Есть места</span>
      </div>
      <div className={styles.body}>
        <h3 className={styles.name}>{restaurant.name}</h3>
        <div className={styles.meta}>
          <span className={styles.cuisine}>{restaurant.cuisine_type}</span>
          {restaurant.district && <span className={styles.district}>· {restaurant.district}</span>}
        </div>
        {restaurant.address && <p className={styles.address}>{restaurant.address}</p>}
      </div>
    </Link>
  )
}

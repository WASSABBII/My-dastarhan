'use client'

import { useState, useEffect } from 'react'
import type { Restaurant, RestaurantPhoto } from '@/types/api.types'
import styles from './RestaurantHero.module.css'

interface RestaurantHeroProps {
  restaurant: Restaurant
  photos: RestaurantPhoto[]
}

export default function RestaurantHero({ restaurant, photos }: RestaurantHeroProps) {
  const allPhotos: string[] = [
    ...(restaurant.cover_photo_url ? [restaurant.cover_photo_url] : []),
    ...photos.map(p => p.url),
  ].filter((url, i, arr) => arr.indexOf(url) === i) // dedupe

  const [active, setActive] = useState(0)
  const [prev, setPrev] = useState<number | null>(null)

  useEffect(() => {
    if (allPhotos.length <= 1) return
    const id = setInterval(() => {
      setActive(cur => {
        setPrev(cur)
        return (cur + 1) % allPhotos.length
      })
    }, 4500)
    return () => clearInterval(id)
  }, [allPhotos.length])

  const goTo = (i: number) => {
    if (i === active) return
    setPrev(active)
    setActive(i)
  }

  const hasPhotos = allPhotos.length > 0

  return (
    <div className={styles.hero}>
      {/* Photo layers */}
      {hasPhotos ? (
        <>
          {allPhotos.map((url, i) => (
            <div
              key={url}
              className={`${styles.slide} ${i === active ? styles.slideActive : ''} ${i === prev ? styles.slidePrev : ''}`}
            >
              <img src={url} alt={restaurant.name} className={styles.image} />
            </div>
          ))}
        </>
      ) : (
        <div className={styles.gradient}>
          <span className={styles.emoji}>🍽️</span>
        </div>
      )}

      {/* Dark overlay */}
      <div className={styles.overlay} />

      {/* Content */}
      <div className={styles.content}>
        <span className={styles.cuisine}>{restaurant.cuisine_type}</span>
        <h1 className={styles.name}>{restaurant.name}</h1>
        {restaurant.address && <p className={styles.address}>📍 {restaurant.address}</p>}
      </div>

      {/* Dot navigation (only if 2+ photos) */}
      {allPhotos.length > 1 && (
        <div className={styles.dots}>
          {allPhotos.map((_, i) => (
            <button
              key={i}
              className={`${styles.dot} ${i === active ? styles.dotActive : ''}`}
              onClick={() => goTo(i)}
              aria-label={`Фото ${i + 1}`}
            />
          ))}
        </div>
      )}

      {/* Photo count badge */}
      {allPhotos.length > 1 && (
        <div className={styles.photoCount}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <polyline points="21 15 16 10 5 21" />
          </svg>
          {active + 1} / {allPhotos.length}
        </div>
      )}
    </div>
  )
}

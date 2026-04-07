'use client'

import { useEffect, useState, useCallback } from 'react'
import styles from './page.module.css'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3005/api'

function authHeader() {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : ''
  return { Authorization: `Bearer ${token}` }
}

interface Review {
  id: string
  rating: number
  comment?: string
  created_at: string
  booking: {
    client: {
      name?: string
      phone?: string
    }
  }
}

function Stars({ rating }: { rating: number }) {
  return (
    <span className={styles.stars}>
      {[1,2,3,4,5].map(i => (
        <span key={i} className={i <= rating ? styles.starFilled : styles.starEmpty}>★</span>
      ))}
    </span>
  )
}

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([])
  const [restaurantId, setRestaurantId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

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
    setLoading(true)
    fetch(`${API}/admin/reviews?restaurantId=${restaurantId}`, { headers: authHeader() })
      .then(r => r.json())
      .then(data => setReviews(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [restaurantId])

  useEffect(() => { load() }, [load])

  const avg = reviews.length > 0
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : null

  if (loading) return <div className={styles.loading}>Загружаем отзывы...</div>

  return (
    <div>
      {reviews.length === 0 ? (
        <div className={styles.empty}>Отзывов пока нет. Они появятся после того, как гости оценят визит.</div>
      ) : (
        <>
          <div className={styles.summary}>
            <div className={styles.avgRating}>{avg}</div>
            <Stars rating={Math.round(Number(avg))} />
            <div className={styles.reviewCount}>{reviews.length} отзывов</div>
          </div>
          <div className={styles.list}>
            {reviews.map(r => (
              <div key={r.id} className={styles.reviewCard}>
                <div className={styles.reviewHeader}>
                  <div className={styles.reviewMeta}>
                    <div className={styles.reviewAuthor}>
                      {r.booking?.client?.name || 'Гость'}
                    </div>
                    <div className={styles.reviewDate}>
                      {new Date(r.created_at).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </div>
                  </div>
                  <Stars rating={r.rating} />
                </div>
                {r.comment && <div className={styles.reviewComment}>{r.comment}</div>}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

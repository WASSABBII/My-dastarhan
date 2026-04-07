'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import styles from './page.module.css'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3005/api'

interface BookingInfo {
  restaurantName: string
  restaurantSlug: string
  date: string
  guestsCount: number
}

export default function ReviewPage() {
  const { token } = useParams() as { token: string }
  const [info, setInfo] = useState<BookingInfo | null>(null)
  const [notFound, setNotFound] = useState(false)
  const [rating, setRating] = useState(0)
  const [hovered, setHovered] = useState(0)
  const [comment, setComment] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch(`${API}/review/${token}`)
      .then(r => {
        if (!r.ok) throw new Error()
        return r.json()
      })
      .then(data => setInfo(data))
      .catch(() => setNotFound(true))
  }, [token])

  const handleSubmit = async () => {
    if (rating === 0) { setError('Пожалуйста, выберите оценку'); return }
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`${API}/review/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating, comment: comment.trim() || undefined }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.message || 'Ошибка')
      }
      setSubmitted(true)
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Ошибка при отправке'
      setError(message === 'Отзыв уже оставлен' ? 'Вы уже оставили отзыв для этого визита.' : message)
    } finally {
      setLoading(false)
    }
  }

  if (notFound) {
    return (
      <div className={styles.page}>
        <div className={styles.card}>
          <div className={styles.icon}>✗</div>
          <div className={styles.title}>Ссылка недействительна</div>
          <div className={styles.sub}>Бронирование не найдено или ссылка устарела.</div>
        </div>
      </div>
    )
  }

  if (!info) {
    return <div className={styles.page}><div className={styles.loading}>Загрузка...</div></div>
  }

  if (submitted) {
    return (
      <div className={styles.page}>
        <div className={styles.card}>
          <div className={styles.iconGreen}>✓</div>
          <div className={styles.title}>Спасибо за отзыв!</div>
          <div className={styles.sub}>Ваша оценка очень важна для нас. Ждём вас снова в {info.restaurantName}.</div>
        </div>
      </div>
    )
  }

  const dateLabel = new Date(info.date).toLocaleDateString('ru-RU', {
    day: 'numeric', month: 'long', year: 'numeric',
  })

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.restaurantName}>{info.restaurantName}</div>
        <div className={styles.visitInfo}>Визит {dateLabel} · {info.guestsCount} гост{info.guestsCount === 1 ? 'ь' : info.guestsCount < 5 ? 'я' : 'ей'}</div>
        <div className={styles.title}>Как вам понравилось?</div>

        <div className={styles.starsRow}>
          {[1,2,3,4,5].map(i => (
            <button
              key={i}
              className={`${styles.star} ${i <= (hovered || rating) ? styles.starOn : ''}`}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(0)}
              onClick={() => setRating(i)}
              aria-label={`${i} звезд`}
            >
              ★
            </button>
          ))}
        </div>

        {rating > 0 && (
          <div className={styles.ratingLabel}>
            {['', 'Ужасно', 'Плохо', 'Нормально', 'Хорошо', 'Отлично!'][rating]}
          </div>
        )}

        <textarea
          className={styles.textarea}
          placeholder="Расскажите подробнее (необязательно)..."
          value={comment}
          onChange={e => setComment(e.target.value)}
          rows={4}
        />

        {error && <div className={styles.error}>{error}</div>}

        <button
          className={styles.submitBtn}
          onClick={handleSubmit}
          disabled={loading}
        >
          {loading ? 'Отправляем...' : 'Отправить отзыв'}
        </button>
      </div>
    </div>
  )
}

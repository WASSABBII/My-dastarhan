'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import styles from './page.module.css'

export default function AdminPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/login?type=rest')
      return
    }
    const user = localStorage.getItem('user')
    if (user) {
      try {
        setEmail(JSON.parse(user).email || '')
      } catch {}
    }
  }, [router])

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.logo}>Dastarkhan.</div>
        <h1 className={styles.title}>Кабинет заведения</h1>
        <p className={styles.subtitle}>В разработке</p>
        {email && <p className={styles.email}>{email}</p>}
        <p className={styles.desc}>
          Управление бронированиями, столиками и меню появится в следующей версии.
        </p>
        <button className={styles.logout} onClick={() => {
          localStorage.removeItem('token')
          localStorage.removeItem('user')
          router.push('/')
        }}>
          Выйти
        </button>
      </div>
    </div>
  )
}

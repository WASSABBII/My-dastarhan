'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import styles from './layout.module.css'

const NAV = [
  { href: '/superadmin/restaurants', label: 'Рестораны' },
  { href: '/superadmin/statistics', label: 'Статистика' },
]

export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    const token = localStorage.getItem('token')
    const user = JSON.parse(localStorage.getItem('user') || '{}')
    if (!token || user?.role !== 'super_admin') {
      router.push('/login?type=rest')
    }
  }, [router])

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    router.push('/')
  }

  return (
    <div className={styles.wrap}>
      <aside className={styles.sidebar}>
        <div className={styles.logo}>
          <div className={styles.logoText}>Dastarkhan<span>.</span></div>
          <div className={styles.logoSub}>SuperAdmin</div>
        </div>
        <nav className={styles.nav}>
          {NAV.map(n => (
            <Link
              key={n.href}
              href={n.href}
              className={`${styles.navItem} ${pathname.startsWith(n.href) ? styles.active : ''}`}
            >
              {n.label}
            </Link>
          ))}
        </nav>
        <div className={styles.bottom}>
          <button className={styles.logoutBtn} onClick={handleLogout}>Выйти</button>
        </div>
      </aside>
      <main className={styles.main}>{children}</main>
    </div>
  )
}

'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import styles from './layout.module.css'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3005/api'

const NAV_ITEMS = [
  {
    href: '/admin/bookings',
    label: 'Брони',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="4" width="18" height="18" rx="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
      </svg>
    ),
  },
  {
    href: '/admin/tables',
    label: 'Столики',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
  },
  {
    href: '/admin/menu',
    label: 'Меню',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <line x1="8" y1="6" x2="21" y2="6" />
        <line x1="8" y1="12" x2="21" y2="12" />
        <line x1="8" y1="18" x2="21" y2="18" />
        <line x1="3" y1="6" x2="3.01" y2="6" />
        <line x1="3" y1="12" x2="3.01" y2="12" />
        <line x1="3" y1="18" x2="3.01" y2="18" />
      </svg>
    ),
  },
  {
    href: '/admin/stats',
    label: 'Статистика',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <line x1="18" y1="20" x2="18" y2="10" />
        <line x1="12" y1="20" x2="12" y2="4" />
        <line x1="6" y1="20" x2="6" y2="14" />
      </svg>
    ),
  },
  {
    href: '/admin/reviews',
    label: 'Отзывы',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    ),
  },
  {
    href: '/admin/staff',
    label: 'Сотрудники',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  {
    href: '/admin/knowledge',
    label: 'База знаний',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
        <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
      </svg>
    ),
  },
  {
    href: '/admin/settings',
    label: 'Настройки',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14" />
      </svg>
    ),
  },
]

const MONTHS = ['января','февраля','марта','апреля','мая','июня','июля','августа','сентября','октября','ноября','декабря']
const DAYS = ['Воскресенье','Понедельник','Вторник','Среда','Четверг','Пятница','Суббота']

interface RestaurantItem { id: string; name: string }

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [restaurantName, setRestaurantName] = useState('Мой ресторан')
  const [restaurants, setRestaurants] = useState<RestaurantItem[]>([])
  const [activeRestId, setActiveRestId] = useState<string | null>(null)
  const [showRestDropdown, setShowRestDropdown] = useState(false)
  const [todayLabel, setTodayLabel] = useState('')
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/login?type=rest')
      return
    }
    const d = new Date()
    setTodayLabel(`${DAYS[d.getDay()]}, ${d.getDate()} ${MONTHS[d.getMonth()]}`)

    fetch(`${API}/admin/restaurant`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(data => {
        const list: RestaurantItem[] = Array.isArray(data) ? data : []
        setRestaurants(list)
        const savedId = localStorage.getItem('activeRestaurantId')
        const active = list.find(r => r.id === savedId) || list[0]
        if (active) {
          setRestaurantName(active.name)
          setActiveRestId(active.id)
          localStorage.setItem('activeRestaurantId', active.id)
        }
      })
      .catch(() => {})
  }, [router])

  // close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowRestDropdown(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const switchRestaurant = (r: RestaurantItem) => {
    localStorage.setItem('activeRestaurantId', r.id)
    // full reload so all client-component useEffects re-run with new restaurantId
    window.location.reload()
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    router.push('/')
  }

  const pageTitle = NAV_ITEMS.find(n => pathname.startsWith(n.href))?.label ?? 'Кабинет'

  return (
    <div className={styles.wrap}>
      <aside className={styles.sidebar}>
        <div className={styles.sidebarLogo}>
          <div className={styles.sidebarLogoText}>Dastarkhan<span>.</span></div>
          <div className={styles.sidebarSubtitle}>Кабинет ресторана</div>
        </div>

        <nav className={styles.sidebarNav}>
          {NAV_ITEMS.map(item => (
            <Link
              key={item.href}
              href={item.href}
              className={`${styles.navItem} ${pathname.startsWith(item.href) ? styles.active : ''}`}
            >
              {item.icon}
              {item.label}
            </Link>
          ))}
        </nav>

        <div className={styles.sidebarBottom} ref={dropdownRef}>
          <div className={styles.restaurantInfo} onClick={() => restaurants.length > 1 && setShowRestDropdown(v => !v)} style={{ cursor: restaurants.length > 1 ? 'pointer' : 'default' }}>
            <div className={styles.riAvatar}>🏯</div>
            <div style={{ flex: 1, overflow: 'hidden' }}>
              <div className={styles.riName} style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{restaurantName}</div>
              <div className={styles.riStatus}>
                <span className={styles.statusDot} />
                Открыто
              </div>
            </div>
            {restaurants.length > 1 && (
              <span style={{ color: '#9c7f6e', fontSize: 10 }}>▾</span>
            )}
          </div>
          {showRestDropdown && restaurants.length > 1 && (
            <div className={styles.restDropdown}>
              {restaurants.map(r => (
                <button
                  key={r.id}
                  className={`${styles.restDropdownItem} ${r.id === activeRestId ? styles.restDropdownActive : ''}`}
                  onClick={() => switchRestaurant(r)}
                >
                  {r.name}
                </button>
              ))}
            </div>
          )}
        </div>
      </aside>

      <div className={styles.main}>
        <div className={styles.topbar}>
          <div className={styles.topbarTitle}>{pageTitle}</div>
          <div className={styles.topbarRight}>
            {todayLabel && <div className={styles.todayBadge}>{todayLabel}</div>}
            <button className={styles.logoutBtn} onClick={handleLogout}>Выйти</button>
          </div>
        </div>

        <div className={styles.content}>
          {children}
        </div>
      </div>
    </div>
  )
}

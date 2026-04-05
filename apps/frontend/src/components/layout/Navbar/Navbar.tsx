'use client'

import { useState } from 'react'
import Link from 'next/link'
import styles from './Navbar.module.css'

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <>
      <nav className={styles.nav}>
        <Link href="/" className={styles.logo}>
          <div className={styles.logoMark}>
            <svg viewBox="0 0 24 24">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
            </svg>
          </div>
          <span className={styles.logoText}>
            Dastarkhan<span>.</span>
          </span>
        </Link>

        <ul className={styles.navList}>
          <li><Link href="#">Рестораны</Link></li>
          <li><Link href="#">Кухни</Link></li>
          <li><Link href="#">Акции</Link></li>
          <li><Link href="#">О нас</Link></li>
          <li>
            <Link href="/login?type=rest" className={styles.navRestaurant}>
              Для ресторанов
            </Link>
          </li>
          <li>
            <Link href="/login" className={styles.navCta}>
              Войти
            </Link>
          </li>
        </ul>

        <button
          className={styles.burgerBtn}
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Открыть меню"
          aria-expanded={mobileOpen}
        >
          <span className={styles.burgerLine} />
          <span className={styles.burgerLine} />
          <span className={styles.burgerLine} />
        </button>
      </nav>

      <div className={`${styles.mobileMenu} ${mobileOpen ? styles.open : ''}`}>
        <ul className={styles.mobileNavList}>
          <li><Link href="#" onClick={() => setMobileOpen(false)}>Рестораны</Link></li>
          <li><Link href="#" onClick={() => setMobileOpen(false)}>Кухни</Link></li>
          <li><Link href="#" onClick={() => setMobileOpen(false)}>Акции</Link></li>
          <li><Link href="#" onClick={() => setMobileOpen(false)}>О нас</Link></li>
        </ul>
        <Link href="/login?type=rest" className={styles.mobileRestaurant} onClick={() => setMobileOpen(false)}>
          Для ресторанов
        </Link>
        <Link href="/login" className={styles.mobileCta} onClick={() => setMobileOpen(false)}>
          Войти
        </Link>
      </div>
    </>
  )
}

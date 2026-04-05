'use client'

import { useState } from 'react'
import Link from 'next/link'
import styles from './Footer.module.css'

export default function Footer() {
  const [activeLang, setActiveLang] = useState('РУС')
  const langs = ['РУС', 'ҚАЗ', 'ENG']

  return (
    <footer className={styles.footer}>
      <div className={styles.footerTop}>
        <div>
          <div className={styles.footerLogo}>
            Dastarkhan<span>.</span>
          </div>
          <p className={styles.footerDesc}>
            Платформа онлайн-бронирования столиков в ресторанах Алматы. Быстро, удобно, бесплатно.
          </p>
        </div>

        <div>
          <div className={styles.footerColTitle}>Сервис</div>
          <ul className={styles.footerLinks}>
            <li><Link href="#">Все рестораны</Link></li>
            <li><Link href="#">Акции</Link></li>
            <li><Link href="#">Мои брони</Link></li>
            <li><Link href="#">Отзывы</Link></li>
          </ul>
        </div>

        <div>
          <div className={styles.footerColTitle}>Ресторанам</div>
          <ul className={styles.footerLinks}>
            <li><Link href="#">Подключить ресторан</Link></li>
            <li><Link href="#">Кабинет заведения</Link></li>
            <li><Link href="#">Тарифы</Link></li>
            <li><Link href="#">API</Link></li>
          </ul>
        </div>

        <div>
          <div className={styles.footerColTitle}>Компания</div>
          <ul className={styles.footerLinks}>
            <li><Link href="#">О нас</Link></li>
            <li><Link href="#">Контакты</Link></li>
            <li><Link href="#">Политика конфиденциальности</Link></li>
            <li><Link href="#">Условия использования</Link></li>
          </ul>
        </div>
      </div>

      <div className={styles.footerBottom}>
        <div className={styles.footerCopy}>© 2025 Dastarkhan. Алматы, Казахстан</div>
        <div className={styles.footerLangs}>
          {langs.map((lang) => (
            <button
              key={lang}
              className={`${styles.langBtn} ${activeLang === lang ? styles.active : ''}`}
              onClick={() => setActiveLang(lang)}
            >
              {lang}
            </button>
          ))}
        </div>
      </div>
    </footer>
  )
}

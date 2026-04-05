'use client'

import { useEffect, useState, useCallback } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts'
import styles from './page.module.css'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3005/api'

function authHeader() {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : ''
  return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
}

interface Overview {
  total: number
  confirmed: number
  arrived: number
  cancelled: number
  noShow: number
  confirmRate: number
}

interface StatsData {
  overview: Overview
  byDay: { date: string; count: number }[]
  byHour: { hour: number; count: number }[]
  topTables: { label: string; count: number }[]
  period: { from: string; to: string }
}

const PERIODS = [
  { label: '7 дней', days: 7 },
  { label: '30 дней', days: 30 },
  { label: '90 дней', days: 90 },
]

function daysAgo(n: number) {
  return new Date(Date.now() - n * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
}

export default function AdminStatsPage() {
  const [restaurantId, setRestaurantId] = useState<string | null>(null)
  const [stats, setStats] = useState<StatsData | null>(null)
  const [period, setPeriod] = useState(30)
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
    const from = daysAgo(period)
    const to = new Date().toISOString().split('T')[0]
    fetch(`${API}/admin/stats?restaurantId=${restaurantId}&from=${from}&to=${to}`, {
      headers: authHeader(),
    })
      .then(r => r.json())
      .then(data => setStats(data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [restaurantId, period])

  useEffect(() => { load() }, [load])

  const maxTable = stats?.topTables[0]?.count || 1

  return (
    <div className={styles.page}>
      <div className={styles.toolbar}>
        <div className={styles.periodTabs}>
          {PERIODS.map(p => (
            <button
              key={p.days}
              className={`${styles.periodBtn} ${period === p.days ? styles.periodActive : ''}`}
              onClick={() => setPeriod(p.days)}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className={styles.loading}>Загружаем статистику...</div>
      ) : !stats ? (
        <div className={styles.empty}>Нет данных</div>
      ) : (
        <>
          {/* Overview cards */}
          <div className={styles.cards}>
            <div className={styles.card}>
              <div className={styles.cardValue}>{stats.overview.total}</div>
              <div className={styles.cardLabel}>Всего броней</div>
            </div>
            <div className={styles.card}>
              <div className={`${styles.cardValue} ${styles.colorGreen}`}>
                {stats.overview.confirmed + stats.overview.arrived}
              </div>
              <div className={styles.cardLabel}>Подтверждено</div>
            </div>
            <div className={styles.card}>
              <div className={`${styles.cardValue} ${styles.colorRed}`}>{stats.overview.noShow}</div>
              <div className={styles.cardLabel}>Не пришли</div>
            </div>
            <div className={styles.card}>
              <div className={`${styles.cardValue} ${styles.colorOrange}`}>{stats.overview.cancelled}</div>
              <div className={styles.cardLabel}>Отменено</div>
            </div>
            <div className={styles.card}>
              <div className={`${styles.cardValue} ${styles.colorBlue}`}>{stats.overview.confirmRate}%</div>
              <div className={styles.cardLabel}>Конверсия</div>
            </div>
          </div>

          {/* Bookings by day */}
          <div className={styles.chartCard}>
            <div className={styles.chartTitle}>Брони по дням</div>
            {stats.byDay.length === 0 ? (
              <div className={styles.chartEmpty}>Нет данных за период</div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={stats.byDay} margin={{ top: 4, right: 8, bottom: 0, left: -10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 11, fill: 'var(--text-sec)' }}
                    tickFormatter={d => d.slice(5)}
                  />
                  <YAxis tick={{ fontSize: 11, fill: 'var(--text-sec)' }} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 13 }}
                    labelFormatter={d => `Дата: ${d}`}
                    formatter={(v) => [v, 'Броней']}
                  />
                  <Bar dataKey="count" fill="#e63922" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* By hour */}
          <div className={styles.chartCard}>
            <div className={styles.chartTitle}>Загруженность по часам</div>
            {stats.byHour.length === 0 ? (
              <div className={styles.chartEmpty}>Нет данных за период</div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={stats.byHour} margin={{ top: 4, right: 8, bottom: 0, left: -10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis
                    dataKey="hour"
                    tick={{ fontSize: 11, fill: 'var(--text-sec)' }}
                    tickFormatter={h => `${h}:00`}
                  />
                  <YAxis tick={{ fontSize: 11, fill: 'var(--text-sec)' }} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 13 }}
                    labelFormatter={h => `${h}:00`}
                    formatter={(v) => [v, 'Броней']}
                  />
                  <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Top tables */}
          {stats.topTables.length > 0 && (
            <div className={styles.chartCard}>
              <div className={styles.chartTitle}>Топ столиков</div>
              <div className={styles.topTables}>
                {stats.topTables.map((t, i) => (
                  <div key={t.label} className={styles.topRow}>
                    <div className={styles.topRank}>{i + 1}</div>
                    <div className={styles.topLabel}>{t.label}</div>
                    <div className={styles.topBarWrap}>
                      <div
                        className={styles.topBar}
                        style={{ width: `${Math.round((t.count / maxTable) * 100)}%` }}
                      />
                    </div>
                    <div className={styles.topCount}>{t.count}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

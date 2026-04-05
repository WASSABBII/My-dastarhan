'use client'
import { useState, useEffect } from 'react'
import TableShape from './TableShape'
import { useSocket } from '@/hooks/useSocket'
import type { TableAvailability } from '@/types/api.types'
import styles from './FloorPlan.module.css'

interface FloorPlanProps {
  tables: TableAvailability[]
  selectedTableIds: string[]
  onTableClick: (id: string) => void
  restaurantId: string
  date: string
}

export default function FloorPlan({ tables, selectedTableIds, onTableClick, restaurantId, date }: FloorPlanProps) {
  const [availability, setAvailability] = useState<TableAvailability[]>(tables)

  useEffect(() => {
    setAvailability(tables)
  }, [tables])

  useSocket(restaurantId, date, (payload) => {
    setAvailability(prev => prev.map(ta =>
      ta.table.id === payload.tableId ? { ...ta, status: payload.status } : ta
    ))
  })

  if (availability.length === 0) {
    return (
      <div className={styles.empty}>
        <p>Столики не настроены. Обратитесь к администратору.</p>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <div className={styles.legend}>
        <span className={styles.legendItem}><span className={styles.dot} style={{ background: '#10b981' }} />Свободно</span>
        <span className={styles.legendItem}><span className={styles.dot} style={{ background: '#e63922' }} />Занято</span>
        <span className={styles.legendItem}><span className={styles.dot} style={{ background: '#fbbf24' }} />Выбрано</span>
      </div>
      <div className={styles.svgWrapper}>
        <svg viewBox="0 0 800 600" className={styles.svg} preserveAspectRatio="xMidYMid meet">
          <rect width="800" height="600" fill="#fef7f0" rx="12" />
          {availability.map(({ table, status }) => (
            <TableShape
              key={table.id}
              table={table}
              status={status}
              selected={selectedTableIds.includes(table.id)}
              onClick={() => onTableClick(table.id)}
            />
          ))}
        </svg>
      </div>
    </div>
  )
}

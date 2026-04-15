'use client'
import { useState, useEffect, useCallback } from 'react'
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

// Table shape dimensions (must match TableShape.tsx)
const SHAPE_SIZE = {
  round:     { w: 60, h: 60 },
  square:    { w: 58, h: 58 },
  rectangle: { w: 88, h: 48 },
}

const PADDING = 28

function calcViewBox(tables: TableAvailability[]) {
  if (tables.length === 0) return '0 0 400 300'

  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity

  for (const { table } of tables) {
    const x = table.pos_x * 8
    const y = table.pos_y * 6
    const { w, h } = SHAPE_SIZE[table.shape] ?? SHAPE_SIZE.square

    if (x < minX) minX = x
    if (y < minY) minY = y
    if (x + w > maxX) maxX = x + w
    if (y + h > maxY) maxY = y + h
  }

  const vx = minX - PADDING
  const vy = minY - PADDING
  const vw = maxX - minX + PADDING * 2
  const vh = maxY - minY + PADDING * 2

  return `${vx} ${vy} ${vw} ${vh}`
}

const Legend = () => (
  <div className={styles.legend}>
    <span className={styles.legendItem}>
      <span className={styles.dot} style={{ background: '#10b981' }} />Свободно
    </span>
    <span className={styles.legendItem}>
      <span className={styles.dot} style={{ background: '#e63922' }} />Занято
    </span>
    <span className={styles.legendItem}>
      <span className={styles.dot} style={{ background: '#fbbf24' }} />Выбрано
    </span>
  </div>
)

export default function FloorPlan({ tables, selectedTableIds, onTableClick, restaurantId, date }: FloorPlanProps) {
  const [availability, setAvailability] = useState<TableAvailability[]>(tables)
  const [expanded, setExpanded] = useState(false)
  const [scale, setScale] = useState(1)

  useEffect(() => { setAvailability(tables) }, [tables])

  // Close modal on Escape
  useEffect(() => {
    if (!expanded) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setExpanded(false) }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [expanded])

  // Prevent body scroll when modal open
  useEffect(() => {
    document.body.style.overflow = expanded ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [expanded])

  useSocket(restaurantId, date, (payload) => {
    setAvailability(prev => prev.map(ta =>
      ta.table.id === payload.tableId ? { ...ta, status: payload.status } : ta
    ))
  })

  const viewBox = calcViewBox(availability)

  const handleTableClick = useCallback((id: string) => {
    const ta = availability.find(t => t.table.id === id)
    if (!ta || ta.status === 'busy') return
    onTableClick(id)
  }, [onTableClick, availability])

  const svgContent = (
    <>
      {availability.map(({ table, status }) => (
        <TableShape
          key={table.id}
          table={table}
          status={status}
          selected={selectedTableIds.includes(table.id)}
          onClick={() => handleTableClick(table.id)}
        />
      ))}
    </>
  )

  if (availability.length === 0) {
    return (
      <div className={styles.empty}>
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
        <p>Столики не настроены. Обратитесь к администратору.</p>
      </div>
    )
  }

  return (
    <>
      {/* ── COMPACT VIEW ── */}
      <div className={styles.container}>
        <div className={styles.header}>
          <Legend />
          <button className={styles.expandBtn} onClick={() => { setExpanded(true); setScale(1) }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="15 3 21 3 21 9" />
              <polyline points="9 21 3 21 3 15" />
              <line x1="21" y1="3" x2="14" y2="10" />
              <line x1="3" y1="21" x2="10" y2="14" />
            </svg>
            Развернуть
          </button>
        </div>

        <div className={styles.svgWrapper}>
          <svg
            viewBox={viewBox}
            className={styles.svg}
            preserveAspectRatio="xMidYMid meet"
          >
            <rect
              x={parseFloat(viewBox.split(' ')[0]) - PADDING}
              y={parseFloat(viewBox.split(' ')[1]) - PADDING}
              width={parseFloat(viewBox.split(' ')[2]) + PADDING * 2}
              height={parseFloat(viewBox.split(' ')[3]) + PADDING * 2}
              fill="#fef7f0"
            />
            {svgContent}
          </svg>
        </div>
      </div>

      {/* ── FULLSCREEN MODAL ── */}
      {expanded && (
        <div className={styles.modalBackdrop} onClick={() => setExpanded(false)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            {/* Modal header */}
            <div className={styles.modalHeader}>
              <div className={styles.modalTitle}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                  <polyline points="9 22 9 12 15 12 15 22" />
                </svg>
                План зала
              </div>
              <div className={styles.modalControls}>
                <Legend />
                {/* Zoom controls */}
                <div className={styles.zoomControls}>
                  <button
                    className={styles.zoomBtn}
                    onClick={() => setScale(s => Math.max(0.4, +(s - 0.2).toFixed(1)))}
                    disabled={scale <= 0.4}
                  >−</button>
                  <span className={styles.zoomLabel}>{Math.round(scale * 100)}%</span>
                  <button
                    className={styles.zoomBtn}
                    onClick={() => setScale(s => Math.min(3, +(s + 0.2).toFixed(1)))}
                    disabled={scale >= 3}
                  >+</button>
                  <button className={styles.zoomReset} onClick={() => setScale(1)}>Сброс</button>
                </div>
                <button className={styles.closeBtn} onClick={() => setExpanded(false)}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Modal SVG */}
            <div className={styles.modalCanvas}>
              <div
                className={styles.modalSvgWrap}
                style={{ transform: `scale(${scale})`, transformOrigin: 'top center' }}
              >
                <svg
                  viewBox={viewBox}
                  className={styles.modalSvg}
                  preserveAspectRatio="xMidYMid meet"
                >
                  <rect
                    x={parseFloat(viewBox.split(' ')[0]) - PADDING}
                    y={parseFloat(viewBox.split(' ')[1]) - PADDING}
                    width={parseFloat(viewBox.split(' ')[2]) + PADDING * 2}
                    height={parseFloat(viewBox.split(' ')[3]) + PADDING * 2}
                    fill="#fef7f0"
                    rx="12"
                  />
                  {svgContent}
                </svg>
              </div>
            </div>

            {/* Modal footer */}
            <div className={styles.modalFooter}>
              <span className={styles.modalHint}>Нажмите Esc или кликните вне плана чтобы закрыть</span>
              {selectedTableIds.length > 0 && (
                <span className={styles.modalSelected}>
                  Выбрано: {selectedTableIds.length} столик{selectedTableIds.length > 1 ? 'а' : ''}
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

'use client'

import { useRef, useState, useEffect, useCallback } from 'react'
import styles from './FloorPlanEditor.module.css'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3005/api'

interface TableData {
  id: string
  label: string
  capacity: number
  shape: 'round' | 'square' | 'rectangle'
  pos_x: number
  pos_y: number
  location_tag?: string | null
  is_active: boolean
}

interface DragState {
  id: string
  startSvgX: number
  startSvgY: number
  startPosX: number
  startPosY: number
}

const SCALE_X = 8
const SCALE_Y = 6
const W = 800
const H = 600

function getShapeWidth(shape: TableData['shape']) {
  return shape === 'rectangle' ? 88 : 58
}
function getShapeHeight(shape: TableData['shape']) {
  return shape === 'rectangle' ? 48 : 58
}

function TableShapeEl({ t, dragging }: { t: TableData; dragging: boolean }) {
  const fill = dragging ? '#fbbf24' : t.is_active ? '#10b981' : '#9ca3af'
  const textX = t.shape === 'rectangle' ? 44 : 30
  const textY = t.shape === 'rectangle' ? 24 : 30

  return (
    <>
      {t.shape === 'round' ? (
        <circle cx="30" cy="30" r="28" fill={fill} stroke="#fff" strokeWidth="2" />
      ) : (
        <rect
          width={getShapeWidth(t.shape)}
          height={getShapeHeight(t.shape)}
          rx="6"
          fill={fill}
          stroke="#fff"
          strokeWidth="2"
        />
      )}
      <text
        x={textX} y={textY}
        textAnchor="middle" dominantBaseline="middle"
        fill="#fff" fontSize="11" fontWeight="600"
        style={{ pointerEvents: 'none', userSelect: 'none' }}
      >
        {t.label}
      </text>
      <text
        x={textX} y={textY + 14}
        textAnchor="middle"
        fill="rgba(255,255,255,0.8)" fontSize="9"
        style={{ pointerEvents: 'none', userSelect: 'none' }}
      >
        {t.capacity} чел
      </text>
    </>
  )
}

interface Props {
  tables: TableData[]
  onSaved?: () => void
}

export default function FloorPlanEditor({ tables, onSaved }: Props) {
  const svgRef = useRef<SVGSVGElement>(null)
  const [positions, setPositions] = useState<Record<string, { x: number; y: number }>>({})
  const [drag, setDrag] = useState<DragState | null>(null)
  const [saving, setSaving] = useState<string | null>(null)
  const [saved, setSaved] = useState<string | null>(null)

  // init positions from props
  useEffect(() => {
    const map: Record<string, { x: number; y: number }> = {}
    for (const t of tables) {
      map[t.id] = { x: t.pos_x, y: t.pos_y }
    }
    setPositions(map)
  }, [tables])

  const svgCoords = useCallback((e: React.MouseEvent | MouseEvent) => {
    const svg = svgRef.current
    if (!svg) return { x: 0, y: 0 }
    const pt = svg.createSVGPoint()
    pt.x = e.clientX
    pt.y = e.clientY
    const ctm = svg.getScreenCTM()
    if (!ctm) return { x: 0, y: 0 }
    const transformed = pt.matrixTransform(ctm.inverse())
    return { x: transformed.x, y: transformed.y }
  }, [])

  const clamp = (val: number, min: number, max: number) => Math.max(min, Math.min(max, val))

  const handleMouseDown = useCallback((e: React.MouseEvent, id: string) => {
    e.preventDefault()
    const { x, y } = svgCoords(e)
    const pos = positions[id] || { x: 0, y: 0 }
    setDrag({
      id,
      startSvgX: x - pos.x * SCALE_X,
      startSvgY: y - pos.y * SCALE_Y,
      startPosX: pos.x,
      startPosY: pos.y,
    })
  }, [svgCoords, positions])

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!drag) return
    const { x, y } = svgCoords(e)
    const table = tables.find(t => t.id === drag.id)
    const maxX = (W - getShapeWidth(table?.shape || 'square')) / SCALE_X
    const maxY = (H - getShapeHeight(table?.shape || 'square')) / SCALE_Y
    const newX = clamp(Math.round((x - drag.startSvgX) / SCALE_X), 0, maxX)
    const newY = clamp(Math.round((y - drag.startSvgY) / SCALE_Y), 0, maxY)
    setPositions(prev => ({ ...prev, [drag.id]: { x: newX, y: newY } }))
  }, [drag, svgCoords, tables])

  const savePosition = useCallback(async (id: string) => {
    const pos = positions[id]
    if (!pos) return
    const token = localStorage.getItem('token') || ''
    setSaving(id)
    try {
      await fetch(`${API}/admin/tables/${id}`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ pos_x: pos.x, pos_y: pos.y }),
      })
      setSaved(id)
      setTimeout(() => setSaved(null), 1200)
      onSaved?.()
    } finally {
      setSaving(null)
    }
  }, [positions, onSaved])

  const handleMouseUp = useCallback(() => {
    if (!drag) return
    const id = drag.id
    setDrag(null)
    savePosition(id)
  }, [drag, savePosition])

  useEffect(() => {
    if (!drag) return
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [drag, handleMouseMove, handleMouseUp])

  if (tables.length === 0) {
    return (
      <div className={styles.empty}>
        Столиков нет. Добавьте столики через список, затем расставьте их на плане.
      </div>
    )
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.hint}>
        Перетащите столики для изменения позиции. Изменения сохраняются автоматически.
      </div>
      <div className={styles.svgWrap}>
        <svg
          ref={svgRef}
          viewBox={`0 0 ${W} ${H}`}
          className={styles.svg}
          preserveAspectRatio="xMidYMid meet"
          style={{ cursor: drag ? 'grabbing' : 'default' }}
        >
          <rect width={W} height={H} fill="#fef7f0" rx="12" />
          {/* grid */}
          {Array.from({ length: Math.floor(W / 80) }).map((_, i) => (
            <line
              key={`vl${i}`}
              x1={(i + 1) * 80} y1={0} x2={(i + 1) * 80} y2={H}
              stroke="#f0e6dc" strokeWidth="1"
            />
          ))}
          {Array.from({ length: Math.floor(H / 60) }).map((_, i) => (
            <line
              key={`hl${i}`}
              x1={0} y1={(i + 1) * 60} x2={W} y2={(i + 1) * 60}
              stroke="#f0e6dc" strokeWidth="1"
            />
          ))}

          {tables.map(t => {
            const pos = positions[t.id] || { x: t.pos_x, y: t.pos_y }
            const svgX = pos.x * SCALE_X
            const svgY = pos.y * SCALE_Y
            const isDragging = drag?.id === t.id
            const isSaved = saved === t.id
            const isSaving = saving === t.id

            return (
              <g
                key={t.id}
                transform={`translate(${svgX}, ${svgY})`}
                style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
                onMouseDown={e => handleMouseDown(e, t.id)}
              >
                <TableShapeEl t={t} dragging={isDragging} />
                {(isSaving || isSaved) && (
                  <text
                    x={t.shape === 'rectangle' ? 44 : 30}
                    y={-8}
                    textAnchor="middle"
                    fontSize="10"
                    fill={isSaved ? '#10b981' : '#9ca3af'}
                    style={{ pointerEvents: 'none' }}
                  >
                    {isSaved ? '✓' : '…'}
                  </text>
                )}
              </g>
            )
          })}
        </svg>
      </div>
      <div className={styles.legend}>
        <span className={styles.legendItem}>
          <span className={styles.dot} style={{ background: '#10b981' }} />Активен
        </span>
        <span className={styles.legendItem}>
          <span className={styles.dot} style={{ background: '#9ca3af' }} />Неактивен
        </span>
        <span className={styles.legendItem}>
          <span className={styles.dot} style={{ background: '#fbbf24' }} />Перемещается
        </span>
      </div>
    </div>
  )
}

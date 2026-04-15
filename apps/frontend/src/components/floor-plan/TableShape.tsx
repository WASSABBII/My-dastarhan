import type { Table } from '@/types/api.types'

interface TableShapeProps {
  table: Table
  status: 'free' | 'busy'
  selected: boolean
  onClick: () => void
}

const COLORS = {
  free: '#10b981',
  busy: '#e63922',
  selected: '#fbbf24',
}

export default function TableShape({ table, status, selected, onClick }: TableShapeProps) {
  const isBusy = status === 'busy'
  const fill = selected ? COLORS.selected : COLORS[status]
  const x = table.pos_x * 8
  const y = table.pos_y * 6
  const cursor = isBusy ? 'not-allowed' : 'pointer'

  const handleClick = () => {
    if (isBusy) return
    onClick()
  }

  const shape = () => {
    if (table.shape === 'round') return <circle cx="30" cy="30" r="28" fill={fill} stroke="#fff" strokeWidth="2" opacity={isBusy ? 0.55 : 1} />
    if (table.shape === 'square') return <rect width="58" height="58" rx="6" fill={fill} stroke="#fff" strokeWidth="2" opacity={isBusy ? 0.55 : 1} />
    return <rect width="88" height="48" rx="6" fill={fill} stroke="#fff" strokeWidth="2" opacity={isBusy ? 0.55 : 1} />
  }

  const textX = table.shape === 'rectangle' ? 44 : 29
  const textY = table.shape === 'rectangle' ? 24 : 30

  return (
    <g transform={`translate(${x}, ${y})`} onClick={handleClick} style={{ cursor }}>
      {shape()}
      <text
        x={textX} y={textY}
        textAnchor="middle" dominantBaseline="middle"
        fill="#fff" fontSize="11" fontWeight="600"
        style={{ pointerEvents: 'none', userSelect: 'none' }}
      >
        {table.label}
      </text>
      {table.capacity && (
        <text
          x={textX} y={textY + 14}
          textAnchor="middle"
          fill="rgba(255,255,255,0.8)" fontSize="9"
          style={{ pointerEvents: 'none', userSelect: 'none' }}
        >
          {table.capacity} чел
        </text>
      )}
    </g>
  )
}

'use client'

import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  useDraggable,
} from '@dnd-kit/core'
import { useState } from 'react'
import styles from './BookingKanban.module.css'

type BookingStatus = 'pending' | 'confirmed' | 'arrived' | 'cancelled' | 'no_show' | 'extended'

interface Booking {
  id: string
  time_start: string
  time_end: string
  guests_count: number
  status: BookingStatus
  client?: { name?: string; phone?: string }
  booking_tables?: Array<{ table?: { label?: string } }>
}

const COLUMNS: Array<{ key: BookingStatus; label: string }> = [
  { key: 'pending', label: 'Ожидают' },
  { key: 'confirmed', label: 'Подтверждены' },
  { key: 'arrived', label: 'Пришли' },
  { key: 'no_show', label: 'Не пришли' },
]

function BookingCard({ booking }: { booking: Booking }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: booking.id,
    data: { booking },
  })

  const tables = booking.booking_tables?.map(bt => bt.table?.label).filter(Boolean).join(', ')

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      className={`${styles.card} ${isDragging ? styles.dragging : ''}`}
    >
      <div className={styles.cardName}>{booking.client?.name || 'Гость'}</div>
      <div className={styles.cardPhone}>{booking.client?.phone || ''}</div>
      <div className={styles.cardMeta}>
        <span>{booking.time_start?.slice(0, 5)} – {booking.time_end?.slice(0, 5)}</span>
        <span>{booking.guests_count} чел.</span>
      </div>
      {tables && <div className={styles.cardTable}>Стол: {tables}</div>}
    </div>
  )
}

function KanbanColumn({
  column,
  bookings,
}: {
  column: { key: BookingStatus; label: string }
  bookings: Booking[]
}) {
  const { setNodeRef, isOver } = useDroppable({ id: column.key })

  return (
    <div className={`${styles.column} ${isOver ? styles.over : ''}`}>
      <div className={styles.columnHeader}>
        <span className={styles.columnLabel}>{column.label}</span>
        <span className={styles.columnCount}>{bookings.length}</span>
      </div>
      <div ref={setNodeRef} className={styles.columnBody}>
        {bookings.map(b => (
          <BookingCard key={b.id} booking={b} />
        ))}
        {bookings.length === 0 && (
          <div className={styles.emptyCol}>Перетащите сюда</div>
        )}
      </div>
    </div>
  )
}

interface Props {
  bookings: Booking[]
  onStatusChange: (id: string, status: BookingStatus) => void
}

export default function BookingKanban({ bookings, onStatusChange }: Props) {
  const [activeBooking, setActiveBooking] = useState<Booking | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  )

  const handleDragStart = (event: DragStartEvent) => {
    const booking = event.active.data.current?.booking as Booking
    setActiveBooking(booking)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveBooking(null)
    const { active, over } = event
    if (!over) return
    const newStatus = over.id as BookingStatus
    const booking = active.data.current?.booking as Booking
    if (booking.status !== newStatus) {
      onStatusChange(booking.id, newStatus)
    }
  }

  const getByStatus = (status: BookingStatus) =>
    bookings.filter(b => b.status === status)

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className={styles.board}>
        {COLUMNS.map(col => (
          <KanbanColumn
            key={col.key}
            column={col}
            bookings={getByStatus(col.key)}
          />
        ))}
      </div>
      <DragOverlay>
        {activeBooking && (
          <div className={`${styles.card} ${styles.overlay}`}>
            <div className={styles.cardName}>{activeBooking.client?.name || 'Гость'}</div>
            <div className={styles.cardMeta}>
              <span>{activeBooking.time_start?.slice(0, 5)}</span>
              <span>{activeBooking.guests_count} чел.</span>
            </div>
          </div>
        )}
      </DragOverlay>
    </DndContext>
  )
}

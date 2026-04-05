'use client'
import { useEffect, useRef } from 'react'
import { io, Socket } from 'socket.io-client'

export interface TableStatusPayload {
  restaurantId: string
  tableId: string
  date: string
  time: string
  status: 'free' | 'busy'
}

export function useSocket(
  restaurantId: string | null,
  date: string | null,
  onTableStatusChanged: (payload: TableStatusPayload) => void
) {
  const socketRef = useRef<Socket | null>(null)
  const callbackRef = useRef(onTableStatusChanged)
  callbackRef.current = onTableStatusChanged

  useEffect(() => {
    if (!restaurantId || !date) return

    const backendUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3005/api')
      .replace('/api', '')

    const socket = io(`${backendUrl}/bookings`, {
      query: { restaurantId, date },
      transports: ['websocket'],
    })
    socketRef.current = socket

    socket.on('table:status-changed', (payload: TableStatusPayload) => {
      callbackRef.current(payload)
    })

    return () => {
      socket.disconnect()
      socketRef.current = null
    }
  }, [restaurantId, date])
}

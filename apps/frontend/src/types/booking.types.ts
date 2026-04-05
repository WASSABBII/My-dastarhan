import type { Restaurant, Table } from './api.types'

export interface Booking {
  id: string
  restaurant_id: string
  client_id: string
  date: string
  time_start: string
  time_end: string
  guests_count: number
  status: 'pending' | 'confirmed' | 'arrived' | 'cancelled' | 'no_show' | 'extended'
  cancel_token: string
  restaurant?: Restaurant
  booking_tables?: { id: string; table_id: string; table?: Table }[]
  created_at: string
}

export interface CreateBookingPayload {
  restaurantId: string
  tableIds: string[]
  date: string
  timeStart: string
  guestsCount: number
  estimatedDuration?: number
}

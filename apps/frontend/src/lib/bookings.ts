import api from './api'
import type { Booking, CreateBookingPayload } from '../types/booking.types'

export async function createBooking(payload: CreateBookingPayload): Promise<Booking> {
  const res = await api.post('/bookings', payload)
  return res.data
}

export async function getMyBookings(): Promise<{ data: Booking[] }> {
  const res = await api.get('/bookings/my')
  return res.data
}

export async function cancelBookingByAuth(id: string): Promise<void> {
  await api.delete(`/bookings/${id}/cancel`)
}

export async function getBookingByToken(token: string): Promise<Booking> {
  const res = await api.get(`/bookings/cancel/${token}`)
  return res.data
}

export async function cancelBookingByToken(token: string): Promise<void> {
  await api.post(`/bookings/cancel/${token}`)
}

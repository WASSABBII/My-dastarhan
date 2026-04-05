'use client'
import { create } from 'zustand'
import type { Restaurant, TableAvailability } from '../types/api.types'

interface BookingState {
  step: 1 | 2 | 3
  restaurant: Restaurant | null
  date: string
  time: string
  guests: number
  duration: number
  selectedTableIds: string[]
  availability: TableAvailability[]
  guestName: string
  guestPhone: string
  guestEmail: string
  occasion: string
  confirmedBookingId: string | null
  cancelToken: string | null

  setStep: (step: 1 | 2 | 3) => void
  setRestaurant: (r: Restaurant) => void
  setDateTimeGuests: (date: string, time: string, guests: number) => void
  setDuration: (d: number) => void
  toggleTable: (id: string) => void
  setAvailability: (a: TableAvailability[]) => void
  setGuestDetails: (name: string, phone: string, email: string, occasion: string) => void
  setConfirmed: (bookingId: string, token: string) => void
  reset: () => void
}

const defaultState = {
  step: 1 as const,
  restaurant: null,
  date: '',
  time: '',
  guests: 2,
  duration: 90,
  selectedTableIds: [],
  availability: [],
  guestName: '',
  guestPhone: '',
  guestEmail: '',
  occasion: '',
  confirmedBookingId: null,
  cancelToken: null,
}

export const useBookingStore = create<BookingState>()((set) => ({
  ...defaultState,
  setStep: (step) => set({ step }),
  setRestaurant: (restaurant) => set({ restaurant }),
  setDateTimeGuests: (date, time, guests) => set({ date, time, guests }),
  setDuration: (duration) => set({ duration }),
  toggleTable: (id) => set((s) => ({
    selectedTableIds: s.selectedTableIds.includes(id)
      ? s.selectedTableIds.filter(t => t !== id)
      : [...s.selectedTableIds, id]
  })),
  setAvailability: (availability) => set({ availability }),
  setGuestDetails: (guestName, guestPhone, guestEmail, occasion) =>
    set({ guestName, guestPhone, guestEmail, occasion }),
  setConfirmed: (confirmedBookingId, cancelToken) => set({ confirmedBookingId, cancelToken }),
  reset: () => set(defaultState),
}))

import api from './api'

// ── Клиент (OTP) ─────────────────────────────────────────────────

export async function sendOtp(phone: string) {
  const res = await api.post('/auth/client/otp/send', { phone })
  return res.data
}

export async function verifyOtp(phone: string, code: string) {
  const res = await api.post('/auth/client/otp/verify', { phone, code })
  const { accessToken, client, isNew } = res.data
  localStorage.setItem('token', accessToken)
  localStorage.setItem('user', JSON.stringify({ ...client, role: 'client' }))
  return { client, isNew }
}

export async function updateClientName(name: string) {
  const res = await api.patch('/auth/client/profile', { name })
  localStorage.setItem('user', JSON.stringify({ ...res.data, role: 'client' }))
  return res.data
}

// ── Владелец ресторана (email+password) ──────────────────────────

export async function loginOwner(email: string, password: string) {
  const res = await api.post('/auth/login', { email, password })
  const { accessToken, user } = res.data
  localStorage.setItem('token', accessToken)
  localStorage.setItem('user', JSON.stringify(user))
  return user
}

// ── Публичная регистрация ресторана ───────────────────────────────

export async function registerRestaurant(data: {
  name: string
  address: string
  phone: string
  cuisine_type: string
  capacity?: string
  working_hours?: Record<string, string>
  email: string
  contact_person: string
  password: string
}) {
  const res = await api.post('/auth/restaurant/register', data)
  return res.data
}

// ── Утилиты ──────────────────────────────────────────────────────

export function getStoredUser() {
  if (typeof window === 'undefined') return null
  const raw = localStorage.getItem('user')
  return raw ? JSON.parse(raw) : null
}

export function logout() {
  localStorage.removeItem('token')
  localStorage.removeItem('user')
}

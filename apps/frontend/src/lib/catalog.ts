import api from './api'
import type { Restaurant, TableAvailability, MenuCategory, PaginatedResponse } from '../types/api.types'

export interface CatalogFilters {
  cuisine?: string
  district?: string
  date?: string
  time?: string
  guests?: number
  page?: number
}

export async function getCatalog(filters: CatalogFilters = {}): Promise<PaginatedResponse<Restaurant>> {
  const res = await api.get('/catalog', { params: filters })
  return res.data
}

export async function getRestaurantBySlug(slug: string): Promise<{ data: Restaurant }> {
  const res = await api.get(`/catalog/${slug}`)
  return res.data
}

export async function getAvailability(
  slug: string, date: string, time: string, duration?: number
): Promise<{ data: TableAvailability[] }> {
  const res = await api.get(`/catalog/${slug}/availability`, { params: { date, time, duration } })
  return res.data
}

export async function getMenuBySlug(slug: string): Promise<{ data: MenuCategory[] }> {
  const res = await api.get(`/catalog/${slug}/menu`)
  return res.data
}

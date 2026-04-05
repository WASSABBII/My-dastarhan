export interface Restaurant {
  id: string
  slug: string
  name: string
  description: string | null
  address: string
  district: string | null
  cuisine_type: string
  phone: string | null
  working_hours: Record<string, string> | null
  cover_photo_url: string | null
  features: string[] | null
  deposit_required: boolean
  deposit_amount: number | null
  buffer_minutes: number
  status: 'pending' | 'active' | 'blocked'
  photos?: RestaurantPhoto[]
}

export interface RestaurantPhoto {
  id: string
  url: string
  sort_order: number
}

export interface Table {
  id: string
  label: string
  capacity: number
  shape: 'round' | 'square' | 'rectangle'
  pos_x: number
  pos_y: number
  location_tag: string | null
}

export interface TableAvailability {
  table: Table
  status: 'free' | 'busy'
}

export interface MenuCategory {
  id: string
  name: string
  sort_order: number
  items: MenuItem[]
}

export interface MenuItem {
  id: string
  name: string
  description: string | null
  price: number
  photo_url: string | null
  allergens: string[] | null
  is_available: boolean
}

export interface PaginatedResponse<T> {
  data: T[]
  meta: { page: number; total: number }
}

'use client'
import { useEffect, useState } from 'react'
import { useParams, useSearchParams, useRouter } from 'next/navigation'
import { getRestaurantBySlug, getMenuBySlug, getAvailability } from '@/lib/catalog'
import type { Restaurant, RestaurantPhoto, MenuCategory, TableAvailability } from '@/types/api.types'
import RestaurantHero from '@/components/restaurant/RestaurantHero'
import RestaurantTabs from '@/components/restaurant/RestaurantTabs'
import BookingWidget from '@/components/restaurant/BookingWidget'
import MenuTab from '@/components/restaurant/MenuTab'
import ReviewsTab from '@/components/restaurant/ReviewsTab'
import FloorPlan from '@/components/floor-plan/FloorPlan'
import { useBookingStore } from '@/store/booking.store'
import ChatWidget from './ChatWidget'
import styles from './page.module.css'

type TabId = 'about' | 'menu' | 'booking' | 'reviews'

export default function RestaurantPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const router = useRouter()
  const slug = params.slug as string

  const [restaurant, setRestaurant] = useState<Restaurant | null>(null)
  const [photos, setPhotos] = useState<RestaurantPhoto[]>([])
  const [categories, setCategories] = useState<MenuCategory[]>([])
  const today = new Date().toISOString().split('T')[0]
  const [activeTab, setActiveTab] = useState<TabId>('about')
  const [availability, setAvailability] = useState<TableAvailability[]>([])
  const [bookingDate, setBookingDate] = useState(searchParams.get('date') || today)
  const [bookingTime, setBookingTime] = useState(searchParams.get('time') || '19:00')
  const [bookingGuests, setBookingGuests] = useState(2)
  const [loadingAvail, setLoadingAvail] = useState(false)
  const [loading, setLoading] = useState(true)

  const store = useBookingStore()

  useEffect(() => {
    async function load() {
      try {
        const [resRes, menuRes] = await Promise.all([
          getRestaurantBySlug(slug),
          getMenuBySlug(slug),
        ])
        setRestaurant(resRes.data)
        setPhotos(resRes.data.photos || [])
        setCategories(menuRes.data)
      } catch {
        // restaurant not found
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [slug])

  const fetchAvailability = async (date: string, time: string) => {
    if (!date || !time) return
    setLoadingAvail(true)
    try {
      const res = await getAvailability(slug, date, time, store.duration)
      setAvailability(res.data)
    } catch {
      setAvailability([])
    } finally {
      setLoadingAvail(false)
    }
  }

  const handleTabChange = (tab: TabId) => {
    setActiveTab(tab)
    if (tab === 'booking' && availability.length === 0) {
      fetchAvailability(bookingDate, bookingTime)
    }
  }

  const handleSearch = async (date: string, time: string, guests: number) => {
    setBookingDate(date)
    setBookingTime(time)
    setBookingGuests(guests)
    setActiveTab('booking')
    await fetchAvailability(date, time)
  }

  const handleTableClick = (tableId: string) => {
    if (!restaurant) return
    const ta = availability.find(t => t.table.id === tableId)
    if (!ta || ta.status === 'busy') return   // guard: занятый стол не трогаем
    store.setRestaurant(restaurant)
    store.setDateTimeGuests(bookingDate, bookingTime, bookingGuests)
    store.toggleTable(tableId)
    store.setAvailability(availability)
  }

  const handleGoToBooking = () => {
    if (store.selectedTableIds.length === 0) return
    router.push('/booking')
  }

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.loading}>Загрузка...</div>
      </div>
    )
  }

  if (!restaurant) {
    return (
      <div className={styles.page}>
        <div className={styles.notFound}>Ресторан не найден</div>
      </div>
    )
  }

  return (
    <div className={styles.page}>
      <RestaurantHero restaurant={restaurant} photos={photos} />

      <div className={styles.layout}>
        <div className={styles.main}>
          <RestaurantTabs activeTab={activeTab} onChange={handleTabChange} />

          {activeTab === 'about' && (
            <div className={styles.aboutTab}>
              {restaurant.description && (
                <p className={styles.description}>{restaurant.description}</p>
              )}
              {restaurant.features && restaurant.features.length > 0 && (
                <div className={styles.features}>
                  {restaurant.features.map((f, i) => (
                    <div key={i} className={styles.feature}>✓ {f}</div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'menu' && <MenuTab categories={categories} />}

          {activeTab === 'booking' && (
            <div className={styles.bookingTab}>
              {loadingAvail ? (
                <div className={styles.loadingText}>Загружаем план зала...</div>
              ) : (
                <>
                  <FloorPlan
                    tables={availability}
                    selectedTableIds={store.selectedTableIds}
                    onTableClick={handleTableClick}
                    restaurantId={restaurant.id}
                    date={bookingDate}
                  />
                </>
              )}
            </div>
          )}

          {activeTab === 'reviews' && <ReviewsTab />}
        </div>

        <aside className={styles.sidebar}>
          <BookingWidget onSearch={handleSearch} />
        </aside>
      </div>

      <ChatWidget slug={slug} restaurantName={restaurant.name} />
    </div>
  )
}

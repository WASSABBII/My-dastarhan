'use client'
import { useState, useEffect, useCallback, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { getCatalog } from '@/lib/catalog'
import type { CatalogFilters } from '@/lib/catalog'
import type { Restaurant } from '@/types/api.types'
import CatalogFiltersComponent from '@/components/catalog/CatalogFilters'
import RestaurantCard from '@/components/catalog/RestaurantCard'
import styles from './page.module.css'

// 1. Главный компонент страницы теперь просто оборачивает контент в Suspense
export default function CatalogPage() {
  return (
    <Suspense fallback={<div className={styles.page}>Загрузка каталога...</div>}>
      <CatalogContent />
    </Suspense>
  )
}

// 2. Весь основной код переехал в CatalogContent
function CatalogContent() {
  const searchParams = useSearchParams()
  
  const [filters, setFilters] = useState<CatalogFilters>(() => ({
    guests: Number(searchParams.get('guests')) || 2,  
    date: searchParams.get('date') || undefined,
    time: searchParams.get('time') || undefined,
    cuisine: searchParams.get('cuisine') || undefined,
  }))
  
  const [restaurants, setRestaurants] = useState<Restaurant[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
        
  const load = useCallback(async (f: CatalogFilters, p: number) => {
    setLoading(true)
    try {
      const res = await getCatalog({ ...f, page: p })
      setRestaurants(res.data)
      setTotal(res.meta.total)
    } catch {   
      setRestaurants([])
    } finally {
      setLoading(false)
    }
  }, [])
                
  useEffect(() => {
    setPage(1)
    load(filters, 1)
  }, [filters, load])
              
  const handleFiltersChange = (f: CatalogFilters) => {
    setFilters(f)
  }
              
  const totalPages = Math.ceil(total / 12)  
                  
  return (
    <div className={styles.page}> 
      <div className={styles.header}>  
        <h1 className={styles.title}>Рестораны Алматы</h1>
        <p className={styles.subtitle}>{total > 0 ? `Найдено ${total} ресторанов` : 'Поиск ресторанов'}</p>
      </div>
                   
      <div className={styles.layout}>
        <aside className={styles.sidebar}>
          <CatalogFiltersComponent filters={filters} onChange={handleFiltersChange} />
        </aside>
                      
        <div className={styles.main}>
          {loading ? (
            <div className={styles.loadingGrid}>
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className={styles.skeleton} />
              ))}  
            </div>
          ) : restaurants.length === 0 ? (
            <div className={styles.empty}>
              <p>Рестораны не найдены. Попробуйте изменить фильтры.</p>
            </div>
          ) : (
            <>
              <div className={styles.grid}>
                {restaurants.map((r, i) => (
                  <RestaurantCard
                    key={r.id}
                    restaurant={r}
                    date={filters.date}
                    time={filters.time}
                    index={i}
                  />
                ))}
              </div>
              
              {totalPages > 1 && (
                <div className={styles.pagination}>
                  {Array.from({ length: totalPages }).map((_, i) => (
                    <button
                      key={i}
                      className={`${styles.pageBtn} ${page === i + 1 ? styles.activePage : ''}`}
                      onClick={() => { setPage(i + 1); load(filters, i + 1) }}
                    >{i + 1}</button>
                  ))}
                </div>
              )}  
            </>
          )}
        </div>
      </div>
    </div>
  )
}

'use client'
import { useState, useCallback } from 'react'
import { getAvailability } from '@/lib/catalog'
import type { TableAvailability } from '@/types/api.types'

export function useAvailability(slug: string) {
  const [availability, setAvailability] = useState<TableAvailability[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetch = useCallback(async (date: string, time: string, duration?: number) => {
    if (!date || !time) return
    setLoading(true)
    setError(null)
    try {
      const res = await getAvailability(slug, date, time, duration)
      setAvailability(res.data)
    } catch {
      setError('Не удалось загрузить доступность столиков')
    } finally {
      setLoading(false)
    }
  }, [slug])

  return { availability, loading, error, fetch }
}

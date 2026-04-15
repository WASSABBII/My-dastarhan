/**
 * Tests for admin/tables/page.tsx
 * Covers: localStorage.activeRestaurantId read first, fallback fetch,
 *         QR blob URL.revokeObjectURL cleanup, table list render, CRUD actions
 */
import React from 'react'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import '@testing-library/jest-dom'

// ─── Next.js dynamic mock ────────────────────────────────────────────────────
jest.mock('next/dynamic', () => (fn: any, opts: any) => {
  // Return a simple placeholder instead of FloorPlanEditor
  return function DynamicFloorPlan(props: any) {
    return <div data-testid="floor-plan-editor">FloorPlanEditor</div>
  }
})

// ─── localStorage mock ───────────────────────────────────────────────────────
const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: jest.fn((key: string) => store[key] ?? null),
    setItem: jest.fn((key: string, val: string) => { store[key] = val }),
    removeItem: jest.fn((key: string) => { delete store[key] }),
    clear: () => { store = {} },
    _set: (key: string, val: string) => { store[key] = val },
  }
})()

Object.defineProperty(window, 'localStorage', { value: localStorageMock, writable: true })

// ─── URL.createObjectURL / revokeObjectURL mock ───────────────────────────────
const createObjectURLMock = jest.fn(() => 'blob:mock-url')
const revokeObjectURLMock = jest.fn()

Object.defineProperty(URL, 'createObjectURL', { value: createObjectURLMock, writable: true })
Object.defineProperty(URL, 'revokeObjectURL', { value: revokeObjectURLMock, writable: true })

// ─── window.confirm mock ─────────────────────────────────────────────────────
Object.defineProperty(window, 'confirm', { value: jest.fn(() => true), writable: true })

// ─── fetch mock ──────────────────────────────────────────────────────────────
const sampleTables = [
  { id: 't1', label: 'Стол A', capacity: 2, shape: 'square', pos_x: 0, pos_y: 0, is_active: true, location_tag: 'Зал' },
  { id: 't2', label: 'Стол B', capacity: 4, shape: 'round', pos_x: 5, pos_y: 5, is_active: false, location_tag: '' },
]

function setupFetch(tables = sampleTables) {
  global.fetch = jest.fn().mockImplementation((url: string, opts?: RequestInit) => {
    if (url.includes('/qr')) {
      return Promise.resolve({
        ok: true,
        blob: async () => new Blob(['PNG'], { type: 'image/png' }),
      })
    }
    if (url.includes('/admin/restaurant')) {
      return Promise.resolve({
        ok: true,
        json: async () => [{ id: 'rest1', name: 'Test Rest' }],
      })
    }
    // tables list or mutations
    return Promise.resolve({
      ok: true,
      json: async () => tables,
    })
  }) as jest.Mock
}

beforeEach(() => {
  localStorageMock.clear()
  localStorageMock.getItem.mockClear()
  localStorageMock.setItem.mockClear()
  createObjectURLMock.mockClear()
  revokeObjectURLMock.mockClear()
  ;(window.confirm as jest.Mock).mockClear()
  setupFetch()
})

afterEach(() => {
  jest.clearAllMocks()
})

import AdminTablesPage from '../app/admin/tables/page'

// ═══════════════════════════════════════════════════════════════════════════════
// 1. Restaurant ID initialization
// ═══════════════════════════════════════════════════════════════════════════════
describe('AdminTablesPage restaurantId initialization', () => {
  it('reads activeRestaurantId from localStorage first', async () => {
    localStorageMock._set('activeRestaurantId', 'rest-saved')
    localStorageMock._set('token', 'tok')
    localStorageMock.getItem.mockImplementation((k: string) =>
      k === 'activeRestaurantId' ? 'rest-saved' : k === 'token' ? 'tok' : null
    )

    render(<AdminTablesPage />)

    await waitFor(() => {
      // Should NOT call /admin/restaurant since we got it from localStorage
      const calls = (global.fetch as jest.Mock).mock.calls
      const restaurantFetch = calls.filter((c: string[]) => c[0].includes('/admin/restaurant'))
      expect(restaurantFetch.length).toBe(0)
    })
  })

  it('fetches restaurant list when no activeRestaurantId in localStorage', async () => {
    localStorageMock.getItem.mockImplementation((k: string) =>
      k === 'token' ? 'tok' : null
    )

    render(<AdminTablesPage />)

    await waitFor(() => {
      const calls = (global.fetch as jest.Mock).mock.calls
      const restaurantFetch = calls.some((c: string[]) => c[0].includes('/admin/restaurant'))
      expect(restaurantFetch).toBe(true)
    })
  })

  it('sets restaurantId from list[0].id when no localStorage value', async () => {
    localStorageMock.getItem.mockImplementation((k: string) =>
      k === 'token' ? 'tok' : null
    )

    render(<AdminTablesPage />)

    await waitFor(() => {
      // After getting rest1 from /admin/restaurant, should fetch tables with ?restaurantId=rest1
      const calls = (global.fetch as jest.Mock).mock.calls
      const tablesFetch = calls.some((c: string[]) => c[0].includes('restaurantId=rest1'))
      expect(tablesFetch).toBe(true)
    })
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// 2. Table list rendering
// ═══════════════════════════════════════════════════════════════════════════════
describe('AdminTablesPage table list rendering', () => {
  beforeEach(() => {
    localStorageMock.getItem.mockImplementation((k: string) => {
      if (k === 'activeRestaurantId') return 'rest1'
      if (k === 'token') return 'tok'
      return null
    })
  })

  it('shows empty state when no tables', async () => {
    setupFetch([])
    render(<AdminTablesPage />)
    await waitFor(() => {
      expect(screen.getByText(/Столиков нет/)).toBeInTheDocument()
    })
  })

  it('renders table rows', async () => {
    render(<AdminTablesPage />)
    await waitFor(() => {
      expect(screen.getByText('Стол A')).toBeInTheDocument()
      expect(screen.getByText('Стол B')).toBeInTheDocument()
    })
  })

  it('shows capacity values', async () => {
    render(<AdminTablesPage />)
    await waitFor(() => {
      expect(screen.getByText('2')).toBeInTheDocument()
      expect(screen.getByText('4')).toBeInTheDocument()
    })
  })

  it('shows location_tag or dash when empty', async () => {
    render(<AdminTablesPage />)
    await waitFor(() => {
      expect(screen.getByText('Зал')).toBeInTheDocument()
      expect(screen.getByText('—')).toBeInTheDocument()
    })
  })

  it('shows active/inactive badges', async () => {
    render(<AdminTablesPage />)
    await waitFor(() => {
      expect(screen.getByText('Активен')).toBeInTheDocument()
      expect(screen.getByText('Неактивен')).toBeInTheDocument()
    })
  })

  it('shows shape labels', async () => {
    render(<AdminTablesPage />)
    await waitFor(() => {
      expect(screen.getByText('Квадрат')).toBeInTheDocument()
      expect(screen.getByText('Круг')).toBeInTheDocument()
    })
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// 3. Add / Edit form
// ═══════════════════════════════════════════════════════════════════════════════
describe('AdminTablesPage form', () => {
  beforeEach(() => {
    localStorageMock.getItem.mockImplementation((k: string) => {
      if (k === 'activeRestaurantId') return 'rest1'
      if (k === 'token') return 'tok'
      return null
    })
  })

  it('opens add form when + Добавить button clicked', async () => {
    render(<AdminTablesPage />)
    const addBtn = screen.getByText('+ Добавить столик')
    fireEvent.click(addBtn)
    expect(screen.getByText('Новый столик')).toBeInTheDocument()
  })

  it('opens edit form when Изменить clicked', async () => {
    render(<AdminTablesPage />)
    await waitFor(() => {
      expect(screen.getByText('Стол A')).toBeInTheDocument()
    })
    const editBtns = screen.getAllByText('Изменить')
    fireEvent.click(editBtns[0])
    expect(screen.getByText('Редактировать столик')).toBeInTheDocument()
  })

  it('closes form on Отмена click', async () => {
    render(<AdminTablesPage />)
    fireEvent.click(screen.getByText('+ Добавить столик'))
    fireEvent.click(screen.getByText('Отмена'))
    expect(screen.queryByText('Новый столик')).not.toBeInTheDocument()
  })

  it('calls POST when saving new table with label', async () => {
    render(<AdminTablesPage />)
    fireEvent.click(screen.getByText('+ Добавить столик'))

    const labelInput = screen.getByPlaceholderText('Стол 1')
    fireEvent.change(labelInput, { target: { value: 'Стол Новый' } })

    await act(async () => {
      fireEvent.click(screen.getByText('Сохранить'))
    })

    const calls = (global.fetch as jest.Mock).mock.calls
    const postCall = calls.find((c: any[]) => c[1]?.method === 'POST')
    expect(postCall).toBeDefined()
  })

  it('does not call POST when label is empty', async () => {
    render(<AdminTablesPage />)
    fireEvent.click(screen.getByText('+ Добавить столик'))
    // label is empty by default

    await act(async () => {
      fireEvent.click(screen.getByText('Сохранить'))
    })

    const calls = (global.fetch as jest.Mock).mock.calls
    const postCall = calls.find((c: any[]) => c[1]?.method === 'POST')
    expect(postCall).toBeUndefined()
  })

  it('calls PATCH when saving edit', async () => {
    render(<AdminTablesPage />)
    await waitFor(() => {
      expect(screen.getByText('Стол A')).toBeInTheDocument()
    })

    const editBtns = screen.getAllByText('Изменить')
    fireEvent.click(editBtns[0])

    await act(async () => {
      fireEvent.click(screen.getByText('Сохранить'))
    })

    const calls = (global.fetch as jest.Mock).mock.calls
    const patchCall = calls.find((c: any[]) => c[1]?.method === 'PATCH')
    expect(patchCall).toBeDefined()
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// 4. Delete
// ═══════════════════════════════════════════════════════════════════════════════
describe('AdminTablesPage delete', () => {
  beforeEach(() => {
    localStorageMock.getItem.mockImplementation((k: string) => {
      if (k === 'activeRestaurantId') return 'rest1'
      if (k === 'token') return 'tok'
      return null
    })
  })

  it('calls DELETE after confirm', async () => {
    ;(window.confirm as jest.Mock).mockReturnValue(true)
    render(<AdminTablesPage />)

    await waitFor(() => {
      expect(screen.getAllByText('Удалить').length).toBeGreaterThan(0)
    })

    const deleteBtns = screen.getAllByText('Удалить')
    await act(async () => {
      fireEvent.click(deleteBtns[0])
    })

    const calls = (global.fetch as jest.Mock).mock.calls
    const deleteCall = calls.find((c: any[]) => c[1]?.method === 'DELETE')
    expect(deleteCall).toBeDefined()
  })

  it('does not call DELETE when confirm returns false', async () => {
    ;(window.confirm as jest.Mock).mockReturnValue(false)
    render(<AdminTablesPage />)

    await waitFor(() => {
      expect(screen.getAllByText('Удалить').length).toBeGreaterThan(0)
    })

    const deleteBtns = screen.getAllByText('Удалить')
    await act(async () => {
      fireEvent.click(deleteBtns[0])
    })

    const calls = (global.fetch as jest.Mock).mock.calls
    const deleteCall = calls.find((c: any[]) => c[1]?.method === 'DELETE')
    expect(deleteCall).toBeUndefined()
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// 5. View mode toggle
// ═══════════════════════════════════════════════════════════════════════════════
describe('AdminTablesPage view mode toggle', () => {
  beforeEach(() => {
    localStorageMock.getItem.mockImplementation((k: string) => {
      if (k === 'activeRestaurantId') return 'rest1'
      if (k === 'token') return 'tok'
      return null
    })
  })

  it('shows FloorPlanEditor when Plan mode selected', async () => {
    render(<AdminTablesPage />)

    await waitFor(() => {
      expect(screen.getByText('Стол A')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText('План зала'))

    expect(screen.getByTestId('floor-plan-editor')).toBeInTheDocument()
  })

  it('hides add button in plan mode', async () => {
    render(<AdminTablesPage />)

    await waitFor(() => {
      expect(screen.getByText('Стол A')).toBeInTheDocument()
    })

    expect(screen.getByText('+ Добавить столик')).toBeInTheDocument()

    fireEvent.click(screen.getByText('План зала'))

    expect(screen.queryByText('+ Добавить столик')).not.toBeInTheDocument()
  })

  it('returns to list mode from plan mode', async () => {
    render(<AdminTablesPage />)

    fireEvent.click(screen.getByText('План зала'))
    fireEvent.click(screen.getByText('Список'))

    await waitFor(() => {
      expect(screen.getByText('+ Добавить столик')).toBeInTheDocument()
    })
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// 6. QR Code modal + URL.revokeObjectURL cleanup
// ═══════════════════════════════════════════════════════════════════════════════
describe('AdminTablesPage QR code', () => {
  beforeEach(() => {
    localStorageMock.getItem.mockImplementation((k: string) => {
      if (k === 'activeRestaurantId') return 'rest1'
      if (k === 'token') return 'tok'
      return null
    })
  })

  it('opens QR modal when QR button clicked', async () => {
    render(<AdminTablesPage />)

    await waitFor(() => {
      expect(screen.getAllByText('QR').length).toBeGreaterThan(0)
    })

    const qrBtns = screen.getAllByText('QR')
    fireEvent.click(qrBtns[0])

    expect(screen.getByText(/QR-код:/)).toBeInTheDocument()
  })

  it('closes QR modal when Закрыть clicked', async () => {
    render(<AdminTablesPage />)

    await waitFor(() => {
      expect(screen.getAllByText('QR').length).toBeGreaterThan(0)
    })

    fireEvent.click(screen.getAllByText('QR')[0])
    expect(screen.getByText('Закрыть')).toBeInTheDocument()

    fireEvent.click(screen.getByText('Закрыть'))
    expect(screen.queryByText(/QR-код:/)).not.toBeInTheDocument()
  })

  it('calls URL.createObjectURL when QR blob received', async () => {
    render(<AdminTablesPage />)

    await waitFor(() => {
      expect(screen.getAllByText('QR').length).toBeGreaterThan(0)
    })

    await act(async () => {
      fireEvent.click(screen.getAllByText('QR')[0])
    })

    await waitFor(() => {
      expect(createObjectURLMock).toHaveBeenCalled()
    })
  })

  it('calls URL.revokeObjectURL when QR modal closed (cleanup)', async () => {
    render(<AdminTablesPage />)

    await waitFor(() => {
      expect(screen.getAllByText('QR').length).toBeGreaterThan(0)
    })

    // Open modal — triggers QR fetch
    await act(async () => {
      fireEvent.click(screen.getAllByText('QR')[0])
    })

    await waitFor(() => {
      expect(createObjectURLMock).toHaveBeenCalled()
    })

    // Close modal — triggers cleanup (revokeObjectURL via useEffect cleanup)
    await act(async () => {
      fireEvent.click(screen.getByText('Закрыть'))
    })

    // The useEffect cleanup runs when qrTable changes back to null
    await waitFor(() => {
      expect(revokeObjectURLMock).toHaveBeenCalledWith('blob:mock-url')
    })
  })

  it('fetches QR from correct endpoint', async () => {
    render(<AdminTablesPage />)

    await waitFor(() => {
      expect(screen.getAllByText('QR').length).toBeGreaterThan(0)
    })

    await act(async () => {
      fireEvent.click(screen.getAllByText('QR')[0])
    })

    await waitFor(() => {
      const calls = (global.fetch as jest.Mock).mock.calls
      const qrCall = calls.find((c: string[]) => c[0].includes('/qr'))
      expect(qrCall).toBeDefined()
      expect(qrCall[0]).toContain('/admin/tables/t1/qr')
    })
  })
})

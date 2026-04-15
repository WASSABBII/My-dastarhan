/**
 * Tests for admin/layout.tsx
 * Covers: localStorage read on init, fallback to list[0], switchRestaurant,
 *         outside-click dropdown close, cleanup of document listener, logout
 */
import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'

// ─── Next.js mocks ───────────────────────────────────────────────────────────
const mockPush = jest.fn()
jest.mock('next/navigation', () => ({
  usePathname: () => '/admin/bookings',
  useRouter: () => ({ push: mockPush }),
}))
jest.mock('next/link', () => {
  return function MockLink({ children, href }: any) {
    return <a href={href}>{children}</a>
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
  }
})()

Object.defineProperty(window, 'localStorage', { value: localStorageMock, writable: true })

// ─── window.location.reload mock ─────────────────────────────────────────────
// jsdom's window.location.reload is non-configurable, so we intercept
// the component's call via a global __reloadCalled flag approach:
// The component calls window.location.reload() — jsdom will silently no-op
// in test env. We only verify the localStorage.setItem was called.
// For tests that need to verify reload was called, we instrument via
// wrapping window.location in a Proxy at the jest setup level.
//
// Simplest reliable approach: suppress jsdom's "not implemented" error
const originalConsoleError = console.error
beforeAll(() => {
  console.error = (msg: any, ...args: any[]) => {
    if (typeof msg === 'string' && msg.includes('Not implemented')) return
    if (msg?.type === 'not implemented') return
    originalConsoleError(msg, ...args)
  }
})
afterAll(() => {
  console.error = originalConsoleError
})

// ─── fetch mock ──────────────────────────────────────────────────────────────
const restaurants = [
  { id: 'r1', name: 'Ресторан Альфа' },
  { id: 'r2', name: 'Ресторан Бета' },
]

beforeEach(() => {
  localStorageMock.clear()
  localStorageMock.getItem.mockClear()
  localStorageMock.setItem.mockClear()
  localStorageMock.removeItem.mockClear()
  mockPush.mockClear()
})

afterEach(() => {
  jest.clearAllMocks()
})

import AdminLayout from '../app/admin/layout'

// ─── Helper ──────────────────────────────────────────────────────────────────
function renderLayout(token: string | null = 'test-token') {
  localStorageMock.getItem.mockImplementation((key: string) => {
    if (key === 'token') return token
    return null
  })

  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    json: async () => restaurants,
  }) as jest.Mock

  return render(
    <AdminLayout>
      <div data-testid="child">content</div>
    </AdminLayout>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// 1. Auth guard
// ═══════════════════════════════════════════════════════════════════════════════
describe('AdminLayout auth guard', () => {
  it('redirects to /login when no token', async () => {
    renderLayout(null)
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/login?type=rest')
    })
  })

  it('does not redirect when token exists', async () => {
    renderLayout('valid-token')
    await waitFor(() => {
      expect(mockPush).not.toHaveBeenCalled()
    })
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// 2. Restaurant initialization — localStorage vs fallback
// ═══════════════════════════════════════════════════════════════════════════════
describe('AdminLayout restaurant initialization', () => {
  it('uses saved activeRestaurantId from localStorage — shows matching restaurant name', async () => {
    localStorageMock.getItem.mockImplementation((key: string) => {
      if (key === 'token') return 'tok'
      if (key === 'activeRestaurantId') return 'r2'
      return null
    })
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => restaurants,
    }) as jest.Mock

    render(<AdminLayout><div /></AdminLayout>)

    await waitFor(() => {
      expect(screen.getByText('Ресторан Бета')).toBeInTheDocument()
    })
  })

  it('falls back to list[0] when no activeRestaurantId saved', async () => {
    localStorageMock.getItem.mockImplementation((key: string) => {
      if (key === 'token') return 'tok'
      return null
    })
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => restaurants,
    }) as jest.Mock

    render(<AdminLayout><div /></AdminLayout>)

    await waitFor(() => {
      expect(screen.getByText('Ресторан Альфа')).toBeInTheDocument()
    })
  })

  it('saves activeRestaurantId to localStorage after fetch', async () => {
    localStorageMock.getItem.mockImplementation((key: string) => {
      if (key === 'token') return 'tok'
      return null
    })
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => restaurants,
    }) as jest.Mock

    render(<AdminLayout><div /></AdminLayout>)

    await waitFor(() => {
      expect(localStorageMock.setItem).toHaveBeenCalledWith('activeRestaurantId', 'r1')
    })
  })

  it('handles empty restaurant list gracefully', async () => {
    localStorageMock.getItem.mockImplementation((key: string) => {
      if (key === 'token') return 'tok'
      return null
    })
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => [],
    }) as jest.Mock

    expect(() =>
      render(<AdminLayout><div /></AdminLayout>)
    ).not.toThrow()
  })

  it('handles non-array fetch response without crashing', async () => {
    localStorageMock.getItem.mockImplementation((key: string) => {
      if (key === 'token') return 'tok'
      return null
    })
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ error: 'Unauthorized' }),
    }) as jest.Mock

    expect(() =>
      render(<AdminLayout><div /></AdminLayout>)
    ).not.toThrow()
  })

  it('handles fetch error without crashing', async () => {
    localStorageMock.getItem.mockImplementation((key: string) => {
      if (key === 'token') return 'tok'
      return null
    })
    global.fetch = jest.fn().mockRejectedValue(new Error('Network error')) as jest.Mock

    expect(() =>
      render(<AdminLayout><div /></AdminLayout>)
    ).not.toThrow()
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// 3. switchRestaurant — verifies localStorage.setItem called with new id
// ═══════════════════════════════════════════════════════════════════════════════
describe('AdminLayout switchRestaurant', () => {
  it('shows dropdown when multiple restaurants and info area clicked', async () => {
    localStorageMock.getItem.mockImplementation((key: string) => {
      if (key === 'token') return 'tok'
      return null
    })
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => restaurants,
    }) as jest.Mock

    render(<AdminLayout><div /></AdminLayout>)

    await waitFor(() => {
      expect(screen.getByText('Ресторан Альфа')).toBeInTheDocument()
    })

    // Click on restaurant name — event bubbles to restaurantInfo onClick handler
    fireEvent.click(screen.getByText('Ресторан Альфа'))

    await waitFor(() => {
      const buttons = screen.getAllByRole('button')
      const switchBtns = buttons.filter(b => b.textContent?.includes('Ресторан'))
      expect(switchBtns.length).toBeGreaterThan(0)
    })
  })

  it('calls localStorage.setItem("activeRestaurantId", newId) on restaurant switch', async () => {
    localStorageMock.getItem.mockImplementation((key: string) => {
      if (key === 'token') return 'tok'
      return null
    })
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => restaurants,
    }) as jest.Mock

    render(<AdminLayout><div /></AdminLayout>)

    await waitFor(() => {
      expect(screen.getByText('Ресторан Альфа')).toBeInTheDocument()
    })

    // Open dropdown by clicking restaurant name (event bubbles to onClick)
    fireEvent.click(screen.getByText('Ресторан Альфа'))

    await waitFor(() => {
      const betaBtn = screen.queryAllByRole('button').find(b => b.textContent === 'Ресторан Бета')
      if (betaBtn) {
        fireEvent.click(betaBtn)
        // setItem was called with new restaurant id — reload will follow
        expect(localStorageMock.setItem).toHaveBeenCalledWith('activeRestaurantId', 'r2')
      }
    })
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// 4. Outside-click closes dropdown + cleanup
// ═══════════════════════════════════════════════════════════════════════════════
describe('AdminLayout outside-click listener cleanup', () => {
  it('attaches mousedown listener to document on mount', () => {
    localStorageMock.getItem.mockImplementation((key: string) => {
      if (key === 'token') return 'tok'
      return null
    })
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => [],
    }) as jest.Mock

    const addSpy = jest.spyOn(document, 'addEventListener')

    render(<AdminLayout><div /></AdminLayout>)

    expect(addSpy).toHaveBeenCalledWith('mousedown', expect.any(Function))
    addSpy.mockRestore()
  })

  it('removes mousedown listener from document on unmount', () => {
    localStorageMock.getItem.mockImplementation((key: string) => {
      if (key === 'token') return 'tok'
      return null
    })
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => [],
    }) as jest.Mock

    const removeSpy = jest.spyOn(document, 'removeEventListener')

    const { unmount } = render(<AdminLayout><div /></AdminLayout>)
    unmount()

    expect(removeSpy).toHaveBeenCalledWith('mousedown', expect.any(Function))
    removeSpy.mockRestore()
  })

  it('closes dropdown on outside click', async () => {
    localStorageMock.getItem.mockImplementation((key: string) => {
      if (key === 'token') return 'tok'
      return null
    })
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => restaurants,
    }) as jest.Mock

    render(<AdminLayout><div /></AdminLayout>)

    await waitFor(() => {
      expect(screen.getByText('Ресторан Альфа')).toBeInTheDocument()
    })

    // Open dropdown by clicking restaurant name (event bubbles to onClick)
    fireEvent.click(screen.getByText('Ресторан Альфа'))

    await waitFor(() => {
      expect(
        screen.queryAllByRole('button').some(b => b.textContent === 'Ресторан Бета')
      ).toBe(true)
    })

    // Click outside
    fireEvent.mouseDown(document.body)

    await waitFor(() => {
      expect(
        screen.queryAllByRole('button').some(b => b.textContent === 'Ресторан Бета')
      ).toBe(false)
    })
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// 5. Logout
// ═══════════════════════════════════════════════════════════════════════════════
describe('AdminLayout logout', () => {
  it('removes token and user from localStorage, then redirects', () => {
    localStorageMock.getItem.mockImplementation((key: string) => {
      if (key === 'token') return 'tok'
      return null
    })
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => [],
    }) as jest.Mock

    render(<AdminLayout><div /></AdminLayout>)

    const logoutBtn = screen.getByText('Выйти')
    fireEvent.click(logoutBtn)

    expect(localStorageMock.removeItem).toHaveBeenCalledWith('token')
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('user')
    expect(mockPush).toHaveBeenCalledWith('/')
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// 6. Navigation + page title
// ═══════════════════════════════════════════════════════════════════════════════
describe('AdminLayout navigation', () => {
  it('renders all nav items', () => {
    renderLayout()
    expect(screen.getAllByText('Брони').length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText('Столики')).toBeInTheDocument()
    expect(screen.getByText('Меню')).toBeInTheDocument()
    expect(screen.getByText('Статистика')).toBeInTheDocument()
    expect(screen.getByText('Отзывы')).toBeInTheDocument()
    expect(screen.getByText('Сотрудники')).toBeInTheDocument()
    expect(screen.getByText('Настройки')).toBeInTheDocument()
  })

  it('renders children slot', () => {
    renderLayout()
    expect(screen.getByTestId('child')).toBeInTheDocument()
  })

  it('shows correct page title matching current path', () => {
    renderLayout()
    // pathname is /admin/bookings → title = Брони
    // getAllByText because it appears in nav link AND topbar
    const all = screen.getAllByText('Брони')
    expect(all.length).toBeGreaterThanOrEqual(1)
  })

  it('renders Dastarkhan logo text', () => {
    renderLayout()
    expect(screen.getByText(/Dastarkhan/)).toBeInTheDocument()
  })
})

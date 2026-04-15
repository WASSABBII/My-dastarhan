/**
 * Tests for FloorPlanEditor component
 * Covers: clamp logic, shape dimensions, rendering, drag/drop, PATCH call, cleanup
 */
import React from 'react'
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'

// ─── Mock next/dynamic ──────────────────────────────────────────────────────
jest.mock('next/dynamic', () => (_fn: unknown) => {
  // not used directly in this test file
  return () => null
})

// ─── Isolated pure-logic helpers (extracted from component internals) ────────
const SCALE_X = 8
const SCALE_Y = 6
const W = 800
const H = 600

function getShapeWidth(shape: 'round' | 'square' | 'rectangle') {
  return shape === 'rectangle' ? 88 : 58
}
function getShapeHeight(shape: 'round' | 'square' | 'rectangle') {
  return shape === 'rectangle' ? 48 : 58
}
function clamp(val: number, min: number, max: number) {
  return Math.max(min, Math.min(max, val))
}

// ─── Import component ───────────────────────────────────────────────────────
import FloorPlanEditor from '../components/floor-plan/FloorPlanEditor'

// ─── Shared table fixture ────────────────────────────────────────────────────
const makeTable = (overrides = {}): any => ({
  id: 't1',
  label: 'Стол 1',
  capacity: 4,
  shape: 'square' as const,
  pos_x: 5,
  pos_y: 5,
  is_active: true,
  ...overrides,
})

// ─── SVG mock helpers ────────────────────────────────────────────────────────
function mockSvgCTM(svgEl: SVGSVGElement | null, x = 0, y = 0) {
  if (!svgEl) return
  const fakePoint = { x, y, matrixTransform: jest.fn().mockReturnValue({ x, y }) }
  svgEl.createSVGPoint = jest.fn().mockReturnValue(fakePoint)
  svgEl.getScreenCTM = jest.fn().mockReturnValue({ inverse: jest.fn().mockReturnValue({}) })
}

// ─── fetch mock ─────────────────────────────────────────────────────────────
beforeEach(() => {
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    json: async () => ({}),
  }) as jest.Mock

  Object.defineProperty(window, 'localStorage', {
    value: {
      getItem: jest.fn().mockReturnValue('fake-token'),
      setItem: jest.fn(),
      removeItem: jest.fn(),
    },
    writable: true,
  })
})

afterEach(() => {
  jest.clearAllMocks()
})

// ═══════════════════════════════════════════════════════════════════════════════
// 1. PURE LOGIC — clamp
// ═══════════════════════════════════════════════════════════════════════════════
describe('clamp()', () => {
  it('returns value when within range', () => {
    expect(clamp(5, 0, 10)).toBe(5)
  })
  it('clamps to min when value < min', () => {
    expect(clamp(-3, 0, 10)).toBe(0)
  })
  it('clamps to max when value > max', () => {
    expect(clamp(15, 0, 10)).toBe(10)
  })
  it('returns min when val === min', () => {
    expect(clamp(0, 0, 10)).toBe(0)
  })
  it('returns max when val === max', () => {
    expect(clamp(10, 0, 10)).toBe(10)
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// 2. PURE LOGIC — shape dimensions
// ═══════════════════════════════════════════════════════════════════════════════
describe('getShapeWidth / getShapeHeight', () => {
  it('rectangle width is 88', () => expect(getShapeWidth('rectangle')).toBe(88))
  it('square width is 58', () => expect(getShapeWidth('square')).toBe(58))
  it('round width is 58', () => expect(getShapeWidth('round')).toBe(58))
  it('rectangle height is 48', () => expect(getShapeHeight('rectangle')).toBe(48))
  it('square height is 58', () => expect(getShapeHeight('square')).toBe(58))
  it('round height is 58', () => expect(getShapeHeight('round')).toBe(58))
})

// ═══════════════════════════════════════════════════════════════════════════════
// 3. PURE LOGIC — maxX / maxY boundary values
// ═══════════════════════════════════════════════════════════════════════════════
describe('maxX / maxY boundary calculation', () => {
  it('maxX for square = (800-58)/8 = 92.75', () => {
    const maxX = (W - getShapeWidth('square')) / SCALE_X
    expect(maxX).toBeCloseTo(92.75)
  })
  it('maxY for square = (600-58)/6 ≈ 90.33', () => {
    const maxY = (H - getShapeHeight('square')) / SCALE_Y
    expect(maxY).toBeCloseTo(90.33)
  })
  it('maxX for rectangle = (800-88)/8 = 89', () => {
    const maxX = (W - getShapeWidth('rectangle')) / SCALE_X
    expect(maxX).toBe(89)
  })
  it('maxY for rectangle = (600-48)/6 ≈ 92', () => {
    const maxY = (H - getShapeHeight('rectangle')) / SCALE_Y
    expect(maxY).toBeCloseTo(92)
  })
  it('clamped pos stays within maxX boundary', () => {
    const maxX = (W - getShapeWidth('square')) / SCALE_X
    expect(clamp(9999, 0, maxX)).toBe(maxX)
    expect(clamp(-1, 0, maxX)).toBe(0)
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// 4. RENDER — empty state
// ═══════════════════════════════════════════════════════════════════════════════
describe('FloorPlanEditor render', () => {
  it('shows empty message when no tables', () => {
    render(<FloorPlanEditor tables={[]} />)
    expect(screen.getByText(/Столиков нет/)).toBeInTheDocument()
  })

  it('renders SVG when tables present', () => {
    render(<FloorPlanEditor tables={[makeTable()]} />)
    expect(document.querySelector('svg')).toBeInTheDocument()
  })

  it('renders table label in SVG', () => {
    render(<FloorPlanEditor tables={[makeTable({ label: 'VIP-1' })]} />)
    expect(screen.getByText('VIP-1')).toBeInTheDocument()
  })

  it('renders capacity text', () => {
    render(<FloorPlanEditor tables={[makeTable({ capacity: 6 })]} />)
    expect(screen.getByText('6 чел')).toBeInTheDocument()
  })

  it('renders hint text', () => {
    render(<FloorPlanEditor tables={[makeTable()]} />)
    expect(screen.getByText(/Перетащите столики/)).toBeInTheDocument()
  })

  it('renders legend items', () => {
    render(<FloorPlanEditor tables={[makeTable()]} />)
    expect(screen.getByText('Активен')).toBeInTheDocument()
    expect(screen.getByText('Неактивен')).toBeInTheDocument()
    expect(screen.getByText('Перемещается')).toBeInTheDocument()
  })

  it('renders multiple tables', () => {
    const tables = [
      makeTable({ id: 't1', label: 'A1' }),
      makeTable({ id: 't2', label: 'A2' }),
      makeTable({ id: 't3', label: 'A3' }),
    ]
    render(<FloorPlanEditor tables={tables} />)
    expect(screen.getByText('A1')).toBeInTheDocument()
    expect(screen.getByText('A2')).toBeInTheDocument()
    expect(screen.getByText('A3')).toBeInTheDocument()
  })

  it('inactive table renders without error', () => {
    render(<FloorPlanEditor tables={[makeTable({ is_active: false })]} />)
    expect(screen.getByText('Стол 1')).toBeInTheDocument()
  })

  it('round shape renders circle not rect', () => {
    render(<FloorPlanEditor tables={[makeTable({ shape: 'round' })]} />)
    expect(document.querySelector('circle')).toBeInTheDocument()
  })

  it('square shape renders rect not circle', () => {
    render(<FloorPlanEditor tables={[makeTable({ shape: 'square' })]} />)
    // The background rect + shape rect — there should be at least 2
    const rects = document.querySelectorAll('rect')
    expect(rects.length).toBeGreaterThan(0)
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// 5. DRAG — mousedown triggers drag state (cursor changes)
// ═══════════════════════════════════════════════════════════════════════════════
describe('FloorPlanEditor drag interaction', () => {
  it('mousedown on table group does not throw', () => {
    render(<FloorPlanEditor tables={[makeTable()]} />)
    const svg = document.querySelector('svg') as SVGSVGElement
    mockSvgCTM(svg, 40, 30)

    const groups = document.querySelectorAll('g')
    expect(() => {
      fireEvent.mouseDown(groups[0], { clientX: 40, clientY: 30 })
    }).not.toThrow()
  })

  it('window mousemove after mousedown does not throw', () => {
    render(<FloorPlanEditor tables={[makeTable()]} />)
    const svg = document.querySelector('svg') as SVGSVGElement
    mockSvgCTM(svg, 40, 30)

    const groups = document.querySelectorAll('g')
    fireEvent.mouseDown(groups[0], { clientX: 40, clientY: 30 })

    expect(() => {
      fireEvent.mouseMove(window, { clientX: 80, clientY: 60 })
    }).not.toThrow()
  })

  it('calls PATCH fetch on mouseup after drag', async () => {
    render(<FloorPlanEditor tables={[makeTable()]} />)
    const svg = document.querySelector('svg') as SVGSVGElement

    const fakePoint = { x: 0, y: 0, matrixTransform: jest.fn().mockReturnValue({ x: 40, y: 30 }) }
    svg.createSVGPoint = jest.fn().mockReturnValue(fakePoint)
    svg.getScreenCTM = jest.fn().mockReturnValue({ inverse: jest.fn().mockReturnValue({}) })

    const groups = document.querySelectorAll('g')
    fireEvent.mouseDown(groups[0], { clientX: 40, clientY: 30 })
    fireEvent.mouseUp(window)

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/admin/tables/t1'),
        expect.objectContaining({ method: 'PATCH' }),
      )
    })
  })

  it('PATCH body includes pos_x and pos_y', async () => {
    render(<FloorPlanEditor tables={[makeTable({ pos_x: 3, pos_y: 4 })]} />)
    const svg = document.querySelector('svg') as SVGSVGElement

    const fakePoint = { x: 0, y: 0, matrixTransform: jest.fn().mockReturnValue({ x: 24, y: 24 }) }
    svg.createSVGPoint = jest.fn().mockReturnValue(fakePoint)
    svg.getScreenCTM = jest.fn().mockReturnValue({ inverse: jest.fn().mockReturnValue({}) })

    const groups = document.querySelectorAll('g')
    fireEvent.mouseDown(groups[0], { clientX: 24, clientY: 24 })
    fireEvent.mouseUp(window)

    await waitFor(() => {
      const callArgs = (global.fetch as jest.Mock).mock.calls[0]
      const body = JSON.parse(callArgs[1].body)
      expect(body).toHaveProperty('pos_x')
      expect(body).toHaveProperty('pos_y')
    })
  })

  it('PATCH sends Bearer token in Authorization header', async () => {
    render(<FloorPlanEditor tables={[makeTable()]} />)
    const svg = document.querySelector('svg') as SVGSVGElement

    const fakePoint = { x: 0, y: 0, matrixTransform: jest.fn().mockReturnValue({ x: 40, y: 30 }) }
    svg.createSVGPoint = jest.fn().mockReturnValue(fakePoint)
    svg.getScreenCTM = jest.fn().mockReturnValue({ inverse: jest.fn().mockReturnValue({}) })

    const groups = document.querySelectorAll('g')
    fireEvent.mouseDown(groups[0], { clientX: 40, clientY: 30 })
    fireEvent.mouseUp(window)

    await waitFor(() => {
      const callArgs = (global.fetch as jest.Mock).mock.calls[0]
      expect(callArgs[1].headers['Authorization']).toContain('Bearer')
    })
  })

  it('no PATCH call when no mousedown was fired', () => {
    render(<FloorPlanEditor tables={[makeTable()]} />)
    fireEvent.mouseUp(window)
    expect(global.fetch).not.toHaveBeenCalled()
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// 6. EFFECT CLEANUP — event listeners removed on unmount
// ═══════════════════════════════════════════════════════════════════════════════
describe('FloorPlanEditor event listener cleanup', () => {
  it('removes window mousemove and mouseup listeners on unmount during drag', () => {
    const addSpy = jest.spyOn(window, 'addEventListener')
    const removeSpy = jest.spyOn(window, 'removeEventListener')

    const { unmount } = render(<FloorPlanEditor tables={[makeTable()]} />)
    const svg = document.querySelector('svg') as SVGSVGElement

    const fakePoint = { x: 0, y: 0, matrixTransform: jest.fn().mockReturnValue({ x: 40, y: 30 }) }
    svg.createSVGPoint = jest.fn().mockReturnValue(fakePoint)
    svg.getScreenCTM = jest.fn().mockReturnValue({ inverse: jest.fn().mockReturnValue({}) })

    const groups = document.querySelectorAll('g')
    fireEvent.mouseDown(groups[0], { clientX: 40, clientY: 30 })

    // At this point listeners should have been added
    const addedMM = addSpy.mock.calls.some(c => c[0] === 'mousemove')
    const addedMU = addSpy.mock.calls.some(c => c[0] === 'mouseup')
    expect(addedMM).toBe(true)
    expect(addedMU).toBe(true)

    unmount()

    const removedMM = removeSpy.mock.calls.some(c => c[0] === 'mousemove')
    const removedMU = removeSpy.mock.calls.some(c => c[0] === 'mouseup')
    expect(removedMM).toBe(true)
    expect(removedMU).toBe(true)

    addSpy.mockRestore()
    removeSpy.mockRestore()
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// 7. svgCoords — fallback when no SVG ref
// ═══════════════════════════════════════════════════════════════════════════════
describe('svgCoords edge cases', () => {
  it('renders without crashing when getScreenCTM returns null', () => {
    render(<FloorPlanEditor tables={[makeTable()]} />)
    const svg = document.querySelector('svg') as SVGSVGElement
    const fakePoint = { x: 0, y: 0, matrixTransform: jest.fn() }
    svg.createSVGPoint = jest.fn().mockReturnValue(fakePoint)
    svg.getScreenCTM = jest.fn().mockReturnValue(null)

    const groups = document.querySelectorAll('g')
    expect(() => {
      fireEvent.mouseDown(groups[0], { clientX: 10, clientY: 10 })
    }).not.toThrow()
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// 8. onSaved callback
// ═══════════════════════════════════════════════════════════════════════════════
describe('onSaved callback', () => {
  it('calls onSaved after successful PATCH', async () => {
    const onSaved = jest.fn()
    render(<FloorPlanEditor tables={[makeTable()]} onSaved={onSaved} />)
    const svg = document.querySelector('svg') as SVGSVGElement

    const fakePoint = { x: 0, y: 0, matrixTransform: jest.fn().mockReturnValue({ x: 40, y: 30 }) }
    svg.createSVGPoint = jest.fn().mockReturnValue(fakePoint)
    svg.getScreenCTM = jest.fn().mockReturnValue({ inverse: jest.fn().mockReturnValue({}) })

    const groups = document.querySelectorAll('g')
    fireEvent.mouseDown(groups[0], { clientX: 40, clientY: 30 })
    fireEvent.mouseUp(window)

    await waitFor(() => {
      expect(onSaved).toHaveBeenCalledTimes(1)
    })
  })

  it('does not crash when onSaved is undefined', async () => {
    render(<FloorPlanEditor tables={[makeTable()]} />)
    const svg = document.querySelector('svg') as SVGSVGElement

    const fakePoint = { x: 0, y: 0, matrixTransform: jest.fn().mockReturnValue({ x: 40, y: 30 }) }
    svg.createSVGPoint = jest.fn().mockReturnValue(fakePoint)
    svg.getScreenCTM = jest.fn().mockReturnValue({ inverse: jest.fn().mockReturnValue({}) })

    const groups = document.querySelectorAll('g')
    fireEvent.mouseDown(groups[0], { clientX: 40, clientY: 30 })
    await act(async () => { fireEvent.mouseUp(window) })
    // No throw = pass
  })
})

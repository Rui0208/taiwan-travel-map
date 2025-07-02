import React from 'react'
import { vi } from 'vitest'
import '@testing-library/jest-dom'
import { render } from '@testing-library/react'
import TaiwanMap from '../TaiwanMap'
import * as swr from 'swr'

// Mock the SVG map data
vi.mock('@svg-maps/taiwan', () => ({
  default: {
    locations: [
      {
        id: 'taipei',
        name: 'Taipei City',
        path: 'M100,100 L200,100 L200,200 L100,200 Z',
      },
      {
        id: 'taichung',
        name: 'Taichung City',
        path: 'M300,100 L400,100 L400,200 L300,200 Z',
      },
    ],
  },
}))

describe('TaiwanMap', () => {
  const defaultProps = {
    onDataChange: vi.fn(),
    onStatsChange: vi.fn(),
    initialViewMode: 'all' as const,
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.restoreAllMocks()
  })

  it('renders without crashing', () => {
    render(<TaiwanMap {...defaultProps} />)
    // 檢查 SVG 元素是否存在
    expect(document.querySelector('svg')).toBeInTheDocument()
  })

  it('displays map view toggle', () => {
    render(<TaiwanMap {...defaultProps} />)
    // 檢查是否有地圖容器
    expect(document.querySelector('.relative.w-full.h-full')).toBeInTheDocument()
  })

  it('shows loading state when data is loading', () => {
    // 動態 mock SWR 回傳 loading 狀態
    vi.spyOn(swr, 'default').mockImplementation(() => ({
      data: undefined,
      error: undefined,
      isLoading: true,
      mutate: vi.fn(),
      isValidating: false,
    }))
    render(<TaiwanMap {...defaultProps} />)
    // 檢查是否有載入中的狀態
    expect(document.querySelector('.animate-spin')).toBeInTheDocument()
  })

  it('calls onStatsChange when data changes', () => {
    // 動態 mock SWR 回傳有資料
    vi.spyOn(swr, 'default').mockImplementation(() => ({
      data: { data: [{ id: 1 }] },
      error: undefined,
      isLoading: false,
      mutate: vi.fn(),
      isValidating: false,
    }))
    render(<TaiwanMap {...defaultProps} />)
    // 當資料載入完成時，應該會調用 onStatsChange
    expect(defaultProps.onStatsChange).toHaveBeenCalled()
  })
}) 
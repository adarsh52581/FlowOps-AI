import { describe, it, expect } from 'vitest'
import { buildGateDisplayOrder } from './buildGateDisplayOrder'

describe('buildGateDisplayOrder', () => {
  const STANDARD_ORDER = ['D', 'C', 'E', 'G', 'B', 'H', 'A', 'F']

  it('returns standard gates in preferred order when all are present', () => {
    const result = buildGateDisplayOrder(
      ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'],
      STANDARD_ORDER
    )
    expect(result).toEqual(['D', 'C', 'E', 'G', 'B', 'H', 'A', 'F'])
  })

  it('skips preferred gates that are missing from the live state', () => {
    const result = buildGateDisplayOrder(['A', 'C', 'E'], STANDARD_ORDER)
    expect(result).toEqual(['C', 'E', 'A'])
  })

  it('appends non-standard gate IDs after the preferred set', () => {
    const result = buildGateDisplayOrder(
      ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'VIP1', 'X'],
      STANDARD_ORDER
    )
    // Standard gates first in preferred order, then extras in insertion order
    expect(result).toEqual(['D', 'C', 'E', 'G', 'B', 'H', 'A', 'F', 'VIP1', 'X'])
  })

  it('renders ONLY non-standard gates when no preferred gates are present', () => {
    const result = buildGateDisplayOrder(['X', 'Y', 'Z'], STANDARD_ORDER)
    expect(result).toEqual(['X', 'Y', 'Z'])
  })

  it('returns empty array for empty input', () => {
    const result = buildGateDisplayOrder([], STANDARD_ORDER)
    expect(result).toEqual([])
  })
})

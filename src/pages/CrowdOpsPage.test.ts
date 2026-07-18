import { describe, it, expect } from 'vitest'
import { useSummaryStats } from './CrowdOpsPage'
import type { GateData } from '../data/mockCrowdData'

describe('useSummaryStats', () => {
  it('should return 0 counts and NaN avgCapacity when gates object is empty', () => {
    const emptyGates: Record<string, GateData> = {}
    const stats = useSummaryStats(emptyGates)

    expect(stats.critical).toBe(0)
    expect(stats.high).toBe(0)
    expect(stats.avgCapacity).toBeNaN()
  })

  it('should accurately compute single-pass stats for populated gates', () => {
    const gates: Record<string, GateData> = {
      A: { id: 'A', status: 'critical', capacityPct: 95 } as GateData,
      B: { id: 'B', status: 'high', capacityPct: 85 } as GateData,
      C: { id: 'C', status: 'low', capacityPct: 30 } as GateData,
      D: { id: 'D', status: 'low', capacityPct: 40 } as GateData,
    }

    const stats = useSummaryStats(gates)
    
    expect(stats.critical).toBe(1)
    expect(stats.high).toBe(1)
    // (95 + 85 + 30 + 40) / 4 = 250 / 4 = 62.5 -> Math.round -> 63
    expect(stats.avgCapacity).toBe(63)
  })
})

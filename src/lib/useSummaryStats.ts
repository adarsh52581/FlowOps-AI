import type { GateData } from '../data/mockCrowdData'

/**
 * Computes summary statistics from the given gate data in a single pass.
 * Returns { critical: 0, high: 0, avgCapacity: NaN } if the input is empty.
 *
 * @param gates - Record of gates keyed by ID
 * @returns Object containing critical count, high count, and rounded average capacity
 */
export function useSummaryStats(gates: Record<string, GateData>) {
  let critical = 0
  let high = 0
  let totalCapacity = 0
  const values = Object.values(gates)
  const count = values.length

  for (const g of values) {
    if (g.status === 'critical') critical++
    else if (g.status === 'high') high++
    totalCapacity += g.capacityPct
  }

  return {
    critical,
    high,
    avgCapacity: Math.round(totalCapacity / count),
  }
}

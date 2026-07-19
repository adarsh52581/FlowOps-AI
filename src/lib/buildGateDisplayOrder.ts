/**
 * buildGateDisplayOrder — produces a complete, stable gate ID list for rendering.
 *
 * Standard gates (from GATE_DISPLAY_ORDER) are listed first in their preferred order,
 * followed by any extra gate IDs present in the live state that aren't in the standard
 * set. This ensures CSV Judge Override uploads with non-standard gate IDs (e.g. "X",
 * "VIP1") still render in the Gate Status list instead of being silently dropped.
 *
 * @param gateIds    - All gate IDs currently present in the live state
 * @param preferredOrder - The preferred display order for the standard set (A-H)
 * @returns Ordered array of gate IDs: preferred first (skipping missing), extras appended
 */
export function buildGateDisplayOrder(
  gateIds: string[],
  preferredOrder: string[]
): string[] {
  const present = new Set(gateIds)
  const seen    = new Set<string>()
  const result: string[] = []

  // 1. Preferred gates first, only if they exist in current state
  for (const id of preferredOrder) {
    if (present.has(id)) {
      result.push(id)
      seen.add(id)
    }
  }

  // 2. Any extra gate IDs not covered by the preferred order, in insertion order
  for (const id of gateIds) {
    if (!seen.has(id)) {
      result.push(id)
    }
  }

  return result
}

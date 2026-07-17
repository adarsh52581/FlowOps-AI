/**
 * mockCrowdData.ts — Shape contract and static stubs only.
 *
 * WHY this file still exists after the Zustand migration:
 * - The TypeScript interfaces (GateData, FacilityData, DensityStatus) are the
 *   canonical shape contract for the CSV upload feature (Sprint 3). The CSV parser
 *   will validate uploaded data against these interfaces before writing to the store.
 * - AI_RECOMMENDATION stays here as a static stub until Gemini integration (Sprint 4).
 *   The AiReasoningCard imports it directly and is intentionally NOT wired to the ticker.
 * - GATE_DISPLAY_ORDER stays here: it's a UI display concern, not live state.
 *
 * The gate and facility data objects (GATES, FACILITIES) have been MOVED to
 * src/store/useCrowdStore.ts as the Zustand initial state. Do not re-add them here.
 */

export type DensityStatus = 'low' | 'medium' | 'high' | 'critical'

export interface GateData {
  id: string
  name: string
  section: string
  capacityPct: number
  /** Percentage-point change in last tick. Positive = filling up, negative = clearing */
  trend: number
  status: DensityStatus
  /** Gate to redirect fans to (null = no redirect needed) */
  redirectTo: string | null
  waitMinutes: number
  /** SVG map coordinates (cx, cy) for the hotspot overlay */
  mapX: number
  mapY: number
}

export interface FacilityData {
  id: string
  type: 'restroom' | 'foodstall' | 'medical'
  label: string
  location: string
  waitMinutes: number
  status: DensityStatus
}

/** Ordered gate IDs for display — sorted by initial urgency (critical → high → medium → low).
 *  CrowdOpsPage uses this for stable display order; the live sort will be dynamic in Sprint 3. */
export const GATE_DISPLAY_ORDER: string[] = ['D', 'C', 'E', 'G', 'B', 'H', 'A', 'F']

/** Hardcoded AI reasoning card data.
 *  NOT wired to the ticker — becomes dynamic in Sprint 4 (Gemini API integration). */
export const AI_RECOMMENDATION = {
  triggeredBy: ['Gate D', 'Gate C'],
  reasoning:
    'Gate D (East Stand) is at 91% capacity with a +8-point surge over the last 5 minutes — this is approaching the safety threshold. Gate C is also elevated at 85% with the steepest inflow rate in the venue. Both gates share the same concourse entry from the metro drop-off.',
  action:
    'Redirect incoming fans from Gates C and D to Gate E (73%, South East) or Gate B (62%, North East). Deploy two volunteers to the Gate C / metro junction to intercept queues before they reach the turnstiles.',
  confidence: 92,
  urgency: 'high' as DensityStatus,
  timestamp: '17:24 IST',
}

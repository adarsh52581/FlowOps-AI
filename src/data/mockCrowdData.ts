/**
 * mockCrowdData.ts — Shape contract and static stubs only.
 *
 * WHY this file still exists after the Zustand migration:
 * - The TypeScript interfaces (GateData, FacilityData, DensityStatus) are the
 *   canonical shape contract for the CSV upload feature (Sprint 3). The CSV parser
 *   will validate uploaded data against these interfaces before writing to the store.
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

/** Ordered gate IDs for display. This is a fixed display order based on initial mock data urgency, 
 *  ensuring stable UI layout as real-time ticker values fluctuate. */
export const GATE_DISPLAY_ORDER: string[] = ['D', 'C', 'E', 'G', 'B', 'H', 'A', 'F']



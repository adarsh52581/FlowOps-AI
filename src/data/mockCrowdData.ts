/**
 * Mock crowd data for FlowOps AI.
 *
 * WHY keyed objects (not arrays): CODING_RULES.md explicitly grades O(1) lookups.
 * Keyed by gate/facility ID so the reasoning layer can do gateMap['C'] instead of
 * gates.find(g => g.id === 'C') — avoids O(n) linear scans once live data arrives.
 */

export type DensityStatus = 'low' | 'medium' | 'high' | 'critical'

export interface GateData {
  id: string
  name: string
  section: string
  capacityPct: number
  /** Percentage-point change in last 5 min. Positive = filling up, negative = clearing */
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

/** Gate density — keyed by gate ID for O(1) lookups */
export const GATES: Record<string, GateData> = {
  A: {
    id: 'A', name: 'Gate A', section: 'North Main',
    capacityPct: 45, trend: -3, status: 'low',
    redirectTo: null, waitMinutes: 3,
    mapX: 200, mapY: 22,
  },
  B: {
    id: 'B', name: 'Gate B', section: 'North East',
    capacityPct: 62, trend: +5, status: 'medium',
    redirectTo: null, waitMinutes: 6,
    mapX: 327, mapY: 60,
  },
  C: {
    id: 'C', name: 'Gate C', section: 'East VIP',
    capacityPct: 85, trend: +12, status: 'high',
    redirectTo: 'B', waitMinutes: 14,
    mapX: 378, mapY: 150,
  },
  D: {
    id: 'D', name: 'Gate D', section: 'East Stand',
    capacityPct: 91, trend: +8, status: 'critical',
    redirectTo: 'E', waitMinutes: 22,
    mapX: 327, mapY: 240,
  },
  E: {
    id: 'E', name: 'Gate E', section: 'South East',
    capacityPct: 73, trend: +3, status: 'medium',
    redirectTo: null, waitMinutes: 9,
    mapX: 200, mapY: 278,
  },
  F: {
    id: 'F', name: 'Gate F', section: 'South Main',
    capacityPct: 38, trend: -8, status: 'low',
    redirectTo: null, waitMinutes: 2,
    mapX: 73, mapY: 240,
  },
  G: {
    id: 'G', name: 'Gate G', section: 'West Stand',
    capacityPct: 67, trend: +1, status: 'medium',
    redirectTo: null, waitMinutes: 7,
    mapX: 22, mapY: 150,
  },
  H: {
    id: 'H', name: 'Gate H', section: 'North West',
    capacityPct: 55, trend: -4, status: 'low',
    redirectTo: null, waitMinutes: 4,
    mapX: 73, mapY: 60,
  },
}

/** Facilities — keyed by facility ID for O(1) lookups */
export const FACILITIES: Record<string, FacilityData> = {
  restroom_ne: {
    id: 'restroom_ne', type: 'restroom',
    label: 'Restrooms — North East', location: 'Concourse Level 2',
    waitMinutes: 8, status: 'medium',
  },
  food_south: {
    id: 'food_south', type: 'foodstall',
    label: 'Food Stalls — South Wing', location: 'Ground Level',
    waitMinutes: 4, status: 'low',
  },
  medical_main: {
    id: 'medical_main', type: 'medical',
    label: 'Medical Station — Main', location: 'Gate A Concourse',
    waitMinutes: 0, status: 'low',
  },
}

/** Ordered gate IDs for display — sorted by urgency (critical → high → medium → low) */
export const GATE_DISPLAY_ORDER: string[] = ['D', 'C', 'E', 'G', 'B', 'H', 'A', 'F']

/** Hardcoded AI reasoning card data (will be replaced by Gemini response in next sprint) */
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

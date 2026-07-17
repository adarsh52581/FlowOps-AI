/**
 * useCrowdStore — Zustand store for live-simulated crowd state.
 *
 * WHY this exists: ARCHITECTURE.md mandates a Zustand store that holds gates
 * and facilities and behaves like a real-time feed via a simulated ticker.
 * The ticker is isolated here so the reasoning layer (getCrowdRecommendation)
 * can be wired to this store in the Gemini integration sprint without touching
 * any UI component.
 *
 * Data shape is intentionally identical to mockCrowdData.ts — that file stays
 * as the shape contract for the CSV upload feature (Sprint 3).
 */

import { create } from 'zustand'
import type { GateData, FacilityData, DensityStatus } from '../data/mockCrowdData'

// ─── Initial data (moved here from mockCrowdData.ts) ──────────────────────────
// Keyed objects kept — O(1) lookup graded by CODING_RULES.md.

const INITIAL_GATES: Record<string, GateData> = {
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

const INITIAL_FACILITIES: Record<string, FacilityData> = {
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

// ─── Status tier computation ───────────────────────────────────────────────────
// Single source of truth for the ≤60/61-79/≥80 thresholds used in DensityCard.
// Keeping it here (not in the UI) means the reasoning layer can call it too.

export function computeStatus(capacityPct: number): DensityStatus {
  if (capacityPct >= 90) return 'critical'
  if (capacityPct >= 80) return 'high'
  if (capacityPct >= 61) return 'medium'
  return 'low'
}

// ─── Wait-time estimation ──────────────────────────────────────────────────────
// Rough linear approximation — replaced by real data in Sprint 3 (CSV upload).
// WHY here: keeps the derivation logic centralised and independently testable
// (CODING_RULES.md: "Comment *why*, not *what*").

function estimateWait(capacityPct: number): number {
  if (capacityPct >= 90) return Math.round(capacityPct * 0.26)  // ~22-26 min
  if (capacityPct >= 80) return Math.round(capacityPct * 0.17)  // ~13-15 min
  if (capacityPct >= 61) return Math.round(capacityPct * 0.10)  // ~6-9 min
  return Math.round(capacityPct * 0.06)                          // ~2-4 min
}

// ─── Redirect logic ────────────────────────────────────────────────────────────
// Maps a gate needing relief to the nearest under-capacity gate.
// Hard-coded as adjacency table — the reasoning layer will derive this
// dynamically from gate data once Gemini is integrated.
const REDIRECT_MAP: Record<string, string | null> = {
  A: null, B: null, C: 'B', D: 'E', E: null, F: null, G: null, H: 'A',
}

function computeRedirect(gateId: string, status: DensityStatus): string | null {
  // Only redirect when elevated — clear/moderate gates don't need it
  if (status === 'low' || status === 'medium') return null
  return REDIRECT_MAP[gateId] ?? null
}

// ─── Store state & actions ────────────────────────────────────────────────────

interface CrowdState {
  gates:       Record<string, GateData>
  facilities:  Record<string, FacilityData>
  lastUpdated: number          // epoch ms — consumers can display "X sec ago"
  tickerId:    ReturnType<typeof setInterval> | null

  /** Start the simulated live feed ticker */
  startTicker: () => void
  /** Stop the ticker (called on component unmount) */
  stopTicker:  () => void
  /** Apply a single tick mutation — exposed for unit-testing without a timer */
  applyTick:   () => void
}

// ─── Ticker logic (pure function — no store ref) ──────────────────────────────

/**
 * Produces an updated gates map with 1-2 random gates mutated.
 *
 * WHY a pure function: testable in isolation (CODING_RULES.md §Testing).
 * The store's applyTick calls this and writes the result — no side-effects inside.
 */
export function computeTickUpdate(
  gates: Record<string, GateData>
): Record<string, GateData> {
  const gateIds = Object.keys(gates)

  // Pick 1 or 2 gates to update this tick (random)
  const count = Math.random() < 0.5 ? 1 : 2
  const shuffled = [...gateIds].sort(() => Math.random() - 0.5)
  const toUpdate = shuffled.slice(0, count)

  // Produce a shallow-copy of the map, mutating only the selected gates
  const next = { ...gates }
  for (const id of toUpdate) {
    const gate = next[id]
    // Delta: -5 to +8, weighted slightly positive to simulate a filling stadium
    const delta = Math.round((Math.random() * 13) - 5)
    const rawPct = gate.capacityPct + delta
    // Clamp between 0–100 (CODING_RULES requirement 3)
    const newPct  = Math.max(0, Math.min(100, rawPct))
    const newStatus   = computeStatus(newPct)
    const newRedirect = computeRedirect(id, newStatus)

    next[id] = {
      ...gate,
      capacityPct: newPct,
      trend:       delta,          // positive = filling, negative = clearing
      status:      newStatus,
      redirectTo:  newRedirect,
      waitMinutes: estimateWait(newPct),
    }
  }
  return next
}

// ─── Store creation ────────────────────────────────────────────────────────────

export const useCrowdStore = create<CrowdState>((set, get) => ({
  gates:       INITIAL_GATES,
  facilities:  INITIAL_FACILITIES,
  lastUpdated: Date.now(),
  tickerId:    null,

  applyTick() {
    const next = computeTickUpdate(get().gates)
    set({ gates: next, lastUpdated: Date.now() })
  },

  startTicker() {
    // Guard: don't double-start
    if (get().tickerId !== null) return

    // Random interval between 4–6 seconds per ARCHITECTURE.md spec
    const scheduleNext = () => {
      const delay = 4000 + Math.random() * 2000   // 4–6 s
      const id = setTimeout(() => {
        get().applyTick()
        // Re-schedule for the next irregular interval (feels more organic than setInterval)
        set({ tickerId: scheduleNext() })
      }, delay)
      return id
    }

    set({ tickerId: scheduleNext() })
  },

  stopTicker() {
    const { tickerId } = get()
    if (tickerId !== null) {
      clearTimeout(tickerId)
      set({ tickerId: null })
    }
  },
}))

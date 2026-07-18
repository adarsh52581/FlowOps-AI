// Mock Firebase module before importing the store
vi.mock('../lib/firebase', () => ({
  db: {},
  monitorDbConnection: vi.fn(() => () => {}),
}))

vi.mock('firebase/database', () => ({
  ref: vi.fn(),
  set: vi.fn().mockResolvedValue(true),
}))

import { useCrowdStore, computeStatus, computeTickUpdate } from './useCrowdStore'
import { monitorDbConnection } from '../lib/firebase'
import * as firebaseDatabase from 'firebase/database'

describe('useCrowdStore', () => {
  beforeEach(() => {
    // Retrieve mock and trigger the connection callback
    const mockMonitor = vi.mocked(monitorDbConnection)
    if (mockMonitor.mock.calls.length > 0) {
      const cb = mockMonitor.mock.calls[0][0]
      cb(true)
    }
  })

  describe('computeStatus', () => {
    it('should classify capacity percentages correctly', () => {
      // Thresholds: ≤60 low, 61-79 medium, 80-89 high, ≥90 critical
      expect(computeStatus(0)).toBe('low')
      expect(computeStatus(59)).toBe('low')
      expect(computeStatus(60)).toBe('low')
      expect(computeStatus(61)).toBe('medium')
      expect(computeStatus(79)).toBe('medium')
      expect(computeStatus(80)).toBe('high')
      expect(computeStatus(89)).toBe('high')
      expect(computeStatus(90)).toBe('critical')
      expect(computeStatus(100)).toBe('critical')
    })
  })

  describe('computeTickUpdate', () => {
    it('should mutate 1 or 2 gates only', () => {
      const initialGates = useCrowdStore.getState().gates
      // Run it many times to cover random branching
      for (let i = 0; i < 50; i++) {
        const next = computeTickUpdate(initialGates)
        let changedCount = 0
        for (const id in initialGates) {
          // Compare object reference instead of capacityPct because delta can randomly be 0
          if (initialGates[id] !== next[id]) {
            changedCount++
          }
        }
        expect(changedCount).toBeGreaterThanOrEqual(1)
        expect(changedCount).toBeLessThanOrEqual(2)
      }
    })

    it('should keep capacityPct between 0 and 100', () => {
      const initialGates = useCrowdStore.getState().gates
      // Create gates near 0 and near 100
      const boundaryGates = {
        ...initialGates,
        A: { ...initialGates.A, capacityPct: 2 },
        B: { ...initialGates.B, capacityPct: 98 },
      }
      for (let i = 0; i < 50; i++) {
        const next = computeTickUpdate(boundaryGates)
        for (const id in next) {
          expect(next[id].capacityPct).toBeGreaterThanOrEqual(0)
          expect(next[id].capacityPct).toBeLessThanOrEqual(100)
        }
      }
    })

    it('should enforce trend matches actual delta instead of raw delta when clamped', () => {
      const initialGates = useCrowdStore.getState().gates
      // Gate A at 100% capacity, Gate B at 0% capacity
      const gates = {
        ...initialGates,
        A: { ...initialGates.A, capacityPct: 100 },
        B: { ...initialGates.B, capacityPct: 0 },
      }

      for (let i = 0; i < 100; i++) {
        const next = computeTickUpdate(gates)
        // Only inspect if they were actually selected for mutation (reference inequality)
        if (next.A !== gates.A) {
          if (next.A.capacityPct === 100) {
            expect(next.A.trend).toBe(0)
          }
        }
        if (next.B !== gates.B) {
          if (next.B.capacityPct === 0) {
            expect(next.B.trend).toBe(0)
          }
        }
      }
    })

    it('should respect the documented per-tick delta range of -5 to +8', () => {
      const initialGates = useCrowdStore.getState().gates
      for (let i = 0; i < 200; i++) {
        const next = computeTickUpdate(initialGates)
        for (const id in initialGates) {
          const diff = next[id].capacityPct - initialGates[id].capacityPct
          if (diff !== 0) {
            expect(diff).toBeGreaterThanOrEqual(-5)
            expect(diff).toBeLessThanOrEqual(8)
          }
        }
      }
    })
  })

  describe('JudgeOverride CSV lifecycle actions & Firebase Syncing', () => {
    beforeEach(() => {
      vi.clearAllMocks()
      useCrowdStore.getState().resetToSimulation()
    })

    afterEach(() => {
      useCrowdStore.getState().stopTicker()
    })

    it('should pause the ticker and sync to Firebase immediately on valid override', () => {
      const store = useCrowdStore.getState()
      expect(store.tickerId).not.toBeNull()
      expect(store.isOverrideActive).toBe(false)

      const mockGates = { ...store.gates }
      // Trigger override
      store.setOverrideData(mockGates, store.facilities)

      const updatedStore = useCrowdStore.getState()
      expect(updatedStore.tickerId).toBeNull()
      expect(updatedStore.isOverrideActive).toBe(true)

      // Verify immediate Firebase write was called
      expect(firebaseDatabase.set).toHaveBeenCalled()
    })

    it('should not sync to Firebase on simulated applyTick()', () => {
      const store = useCrowdStore.getState()
      vi.clearAllMocks()

      // Apply tick
      store.applyTick()

      // Verify Firebase write was NOT called on normal simulated tick
      expect(firebaseDatabase.set).not.toHaveBeenCalled()
    })

    it('should resume ticking and sync to Firebase immediately on reset', () => {
      const store = useCrowdStore.getState()
      // Inject override
      store.setOverrideData({ ...store.gates }, store.facilities)
      expect(useCrowdStore.getState().isOverrideActive).toBe(true)

      vi.clearAllMocks()

      // Reset
      useCrowdStore.getState().resetToSimulation()
      const resetStore = useCrowdStore.getState()
      expect(resetStore.isOverrideActive).toBe(false)
      expect(resetStore.tickerId).not.toBeNull()
      expect(firebaseDatabase.set).toHaveBeenCalled() // Immediate reset write
    })
  })
})

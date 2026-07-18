// @vitest-environment jsdom
import React from 'react'
import { createRoot } from 'react-dom/client'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { JudgeOverride } from './JudgeOverride'
import { useCrowdStore } from '../../store/useCrowdStore'

// Mock Firebase module before importing store dependencies
vi.mock('../../lib/firebase', () => ({
  db: {},
  monitorDbConnection: vi.fn(() => () => {}),
}))

vi.mock('firebase/database', () => ({
  ref: vi.fn(),
  set: vi.fn().mockResolvedValue(true),
}))

describe('JudgeOverride Component Lifecycle', () => {
  let container: HTMLDivElement

  beforeEach(() => {
    container = document.createElement('div')
    document.body.appendChild(container)
    useCrowdStore.getState().resetToSimulation()
    vi.useFakeTimers()
  })

  afterEach(() => {
    document.body.removeChild(container)
    useCrowdStore.getState().stopTicker()
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it('should update store and show success on Mock Valid click', async () => {
    const root = createRoot(container)
    root.render(<JudgeOverride />)

    // Wait for render
    await vi.waitFor(() => {
      expect(container.querySelector('#test-inject-valid')).not.toBeNull()
    })

    const mockValidBtn = container.querySelector('#test-inject-valid') as HTMLButtonElement
    mockValidBtn.click()

    // Wait for state updates
    await vi.waitFor(() => {
      const store = useCrowdStore.getState()
      expect(store.isOverrideActive).toBe(true)
      expect(store.tickerId).toBeNull()
      expect(store.gates.E.capacityPct).toBe(95) // from Mock Valid CSV
    })
  })

  it('should display error and NOT modify store on Mock Invalid click', async () => {
    const root = createRoot(container)
    root.render(<JudgeOverride />)

    await vi.waitFor(() => {
      expect(container.querySelector('#test-inject-invalid')).not.toBeNull()
    })

    const mockInvalidBtn = container.querySelector('#test-inject-invalid') as HTMLButtonElement
    mockInvalidBtn.click()

    await vi.waitFor(() => {
      // Should show alert message
      const alert = container.innerHTML
      expect(alert).toContain('Import Error')
      // Store state should remain unchanged (not in override, ticker running)
      const store = useCrowdStore.getState()
      expect(store.isOverrideActive).toBe(false)
      expect(store.tickerId).not.toBeNull()
    })
  })
})

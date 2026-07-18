// @vitest-environment jsdom
import React, { act } from 'react'
import { createRoot } from 'react-dom/client'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { AiReasoningCard } from './AiReasoningCard'
import type { GateData } from '../../data/mockCrowdData'
import { getCrowdRecommendation } from '../../lib/getCrowdRecommendation'

// Tell React we are in a testing environment that supports act()
// @ts-ignore
globalThis.IS_REACT_ACT_ENVIRONMENT = true

// Mock Firebase module before importing store dependencies
vi.mock('../../lib/firebase', () => ({
  db: {},
  monitorDbConnection: vi.fn(() => () => {}),
}))

vi.mock('firebase/database', () => ({
  ref: vi.fn(),
  set: vi.fn().mockResolvedValue(true),
}))

// Mock getCrowdRecommendation module
vi.mock('../../lib/getCrowdRecommendation', () => ({
  FALLBACK_RECOMMENDATION: {
    headline: 'Mocked Fallback',
    reasoning: 'Reasoning...',
    volunteerAction: 'Action...',
    confidence: 50,
    flaggedGates: [],
    urgency: 'low',
    generatedAt: new Date().toISOString(),
    source: 'fallback',
  },
  getCrowdRecommendation: vi.fn().mockResolvedValue({
    headline: 'Mocked Rec',
    reasoning: 'Reasoning...',
    volunteerAction: 'Action...',
    confidence: 95,
    flaggedGates: ['A'],
    urgency: 'high',
    generatedAt: new Date().toISOString(),
    source: 'gemini'
  })
}))

describe('AiReasoningCard Visibility Cooldown', () => {
  let container: HTMLDivElement

  beforeEach(() => {
    container = document.createElement('div')
    document.body.appendChild(container)
    vi.useFakeTimers()
    vi.clearAllMocks()
  })

  afterEach(() => {
    document.body.removeChild(container)
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it('should block repeat fetches within the 10-second cooldown on visibility toggles', async () => {
    const mockGates: Record<string, GateData> = {
      A: { id: 'A', name: 'Gate A', section: 'North', capacityPct: 85, trend: 0, status: 'high', redirectTo: null, waitMinutes: 10, mapX: 0, mapY: 0 }
    }

    // Set visibilityState initially to visible
    Object.defineProperty(document, 'visibilityState', {
      get() { return 'visible' },
      configurable: true
    })

    const root = createRoot(container)
    await act(async () => {
      root.render(<AiReasoningCard gates={mockGates} />)
    })

    // Wait for initial render and its fetch to fire
    await act(async () => {
      await vi.advanceTimersByTimeAsync(100)
    })
    expect(getCrowdRecommendation).toHaveBeenCalledTimes(1)

    // Mock toggling visibility multiple times rapidly (hiding and showing 3 times in quick succession)
    for (let i = 0; i < 3; i++) {
      await act(async () => {
        Object.defineProperty(document, 'visibilityState', {
          get() { return 'hidden' },
          configurable: true
        })
        document.dispatchEvent(new Event('visibilitychange'))
      })
      await act(async () => {
        vi.advanceTimersByTime(500) // 500ms delay, well below 10s cooldown
        Object.defineProperty(document, 'visibilityState', {
          get() { return 'visible' },
          configurable: true
        })
        document.dispatchEvent(new Event('visibilitychange'))
      })
    }

    // The visibilitychange event handler will be executed, but the cooldown should block it.
    await act(async () => {
      await vi.advanceTimersByTimeAsync(100)
    })
    expect(getCrowdRecommendation).toHaveBeenCalledTimes(1) // Still 1! All rapid fetches were blocked by cooldown.

    // Advance beyond 10-second cooldown (say 9 more seconds -> 11s total) and trigger visibility change
    await act(async () => {
      vi.advanceTimersByTime(9000)
      Object.defineProperty(document, 'visibilityState', {
        get() { return 'hidden' },
        configurable: true
      })
      document.dispatchEvent(new Event('visibilitychange'))
    })
    
    await act(async () => {
      vi.advanceTimersByTime(1000)
      Object.defineProperty(document, 'visibilityState', {
        get() { return 'visible' },
        configurable: true
      })
      document.dispatchEvent(new Event('visibilitychange'))
    })

    await act(async () => {
      await vi.advanceTimersByTimeAsync(100)
    })
    expect(getCrowdRecommendation).toHaveBeenCalledTimes(2) // Fired second time! Cooldown expired.
  })
})

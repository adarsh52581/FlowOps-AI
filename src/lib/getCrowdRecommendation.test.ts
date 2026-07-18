import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { getCrowdRecommendation } from './getCrowdRecommendation'
import type { GateData } from '../data/mockCrowdData'

describe('getCrowdRecommendation', () => {
  const originalFetch = global.fetch

  beforeEach(() => {
    // Set mock environment variables
    import.meta.env.VITE_GEMINI_API_KEY = 'mock_api_key'
    vi.useFakeTimers()
  })

  afterEach(() => {
    global.fetch = originalFetch
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it('should short-circuit and return all-clear if no gate is >= 80%', async () => {
    const mockGates: Record<string, GateData> = {
      A: { id: 'A', name: 'Gate A', section: 'North', capacityPct: 79, trend: 0, status: 'medium', redirectTo: null, waitMinutes: 5, mapX: 0, mapY: 0 }
    }
    const fetchSpy = vi.fn()
    global.fetch = fetchSpy

    const result = await getCrowdRecommendation(mockGates)
    expect(fetchSpy).not.toHaveBeenCalled()
    expect(result.source).toBe('all-clear')
    expect(result.flaggedGates).toEqual([])
    expect(result.urgency).toBe('low')
  })

  it('should retry-with-backoff on 429 and eventually fallback if threshold exceeded', async () => {
    const mockGates: Record<string, GateData> = {
      A: { id: 'A', name: 'Gate A', section: 'North', capacityPct: 85, trend: 0, status: 'high', redirectTo: null, waitMinutes: 10, mapX: 0, mapY: 0 }
    }

    // Mock fetch to return 429 rate limit errors
    const fetchMock = vi.fn().mockImplementation(() => 
      Promise.resolve(new Response(null, { status: 429, statusText: 'Too Many Requests' }))
    )
    global.fetch = fetchMock

    // Start getCrowdRecommendation (which should await timeouts)
    const recPromise = getCrowdRecommendation(mockGates)

    // Wait for the first attempt to run and hit 429, then schedule 1.5s backoff
    await vi.advanceTimersByTimeAsync(1500)
    // Wait for the second attempt to run and hit 429, then schedule 4s backoff
    await vi.advanceTimersByTimeAsync(4000)

    const result = await recPromise
    expect(fetchMock).toHaveBeenCalledTimes(3) // 1 initial + 2 retries
    expect(result.source).toBe('fallback')
  })

  it('should succeed on retry if subsequent call returns 200 OK', async () => {
    const mockGates: Record<string, GateData> = {
      A: { id: 'A', name: 'Gate A', section: 'North', capacityPct: 85, trend: 0, status: 'high', redirectTo: null, waitMinutes: 10, mapX: 0, mapY: 0 }
    }

    // Mock first two calls to fail with 429, and third to succeed with JSON
    const responseJson = {
      candidates: [{
        content: {
          parts: [{
            text: JSON.stringify({
              headline: 'Inflow Surges at Gate A',
              reasoning: 'Gate A is at 85% capacity with elevated inflow.',
              volunteerAction: 'Redirect crowd to Gate B.',
              confidence: 90
            })
          }]
        }
      }]
    }

    let callCount = 0
    const fetchMock = vi.fn().mockImplementation(() => {
      callCount++
      if (callCount < 3) {
        return Promise.resolve(new Response(null, { status: 429, statusText: 'Too Many Requests' }))
      }
      return Promise.resolve(new Response(JSON.stringify(responseJson), { status: 200, statusText: 'OK' }))
    })
    global.fetch = fetchMock

    const recPromise = getCrowdRecommendation(mockGates)
    await vi.advanceTimersByTimeAsync(1500)
    await vi.advanceTimersByTimeAsync(4000)

    const result = await recPromise
    expect(fetchMock).toHaveBeenCalledTimes(3)
    expect(result.source).toBe('gemini')
    expect(result.headline).toBe('Inflow Surges at Gate A')
  })
})

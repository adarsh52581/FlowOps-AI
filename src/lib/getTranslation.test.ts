import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getTranslation, buildTranslatorPrompt } from './getTranslation'

// Mock global fetch
const fetchMock = vi.fn()
globalThis.fetch = fetchMock

describe('getTranslation', () => {
  beforeEach(() => {
    fetchMock.mockReset()
    // Default mock response: happy path
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        candidates: [{
          content: {
            parts: [{
              text: '```json\n{"englishTranslation": "Where is the bathroom?", "urgencyTag": "General Request"}\n```'
            }]
          }
        }]
      })
    })
  })

  it('builds a proper prompt containing the fan input', () => {
    const prompt = buildTranslatorPrompt('Donde esta el bano?')
    expect(prompt).toContain('Donde esta el bano?')
    expect(prompt).toContain('Medical Emergency')
    expect(prompt).toContain('englishTranslation')
  })

  it('handles empty input by returning a fallback response immediately', async () => {
    const result = await getTranslation('   ')
    expect(result.source).toBe('fallback')
    expect(result.englishTranslation).toBe('No input provided.')
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('successfully parses a valid Gemini response', async () => {
    // Need to mock import.meta.env for the key check
    vi.stubEnv('VITE_GEMINI_API_KEY', 'test_key')
    
    const result = await getTranslation('Donde esta el bano?')
    
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(result.source).toBe('gemini')
    expect(result.englishTranslation).toBe('Where is the bathroom?')
    expect(result.urgencyTag).toBe('General Request')
    
    vi.unstubAllEnvs()
  })

  it('returns fallback gracefully on API failure (500)', async () => {
    vi.stubEnv('VITE_GEMINI_API_KEY', 'test_key')
    fetchMock.mockResolvedValueOnce({ ok: false, status: 500 })
    
    const result = await getTranslation('Help me')
    
    expect(result.source).toBe('fallback')
    expect(result.englishTranslation).toContain('Could not connect')
    
    vi.unstubAllEnvs()
  })

  it('truncates fanInput to 1000 characters before sending to API', async () => {
    vi.stubEnv('VITE_GEMINI_API_KEY', 'test_key')
    
    const longInput = 'A'.repeat(1500)
    await getTranslation(longInput)
    
    // Check that fetch was called and extract the body of the request
    expect(fetchMock).toHaveBeenCalled()
    const fetchArgs = fetchMock.mock.calls[0][1]
    const bodyText = JSON.parse(fetchArgs.body).contents[0].parts[0].text
    
    // The actual prompt should contain exactly 1000 'A's
    expect(bodyText).toContain('A'.repeat(1000))
    expect(bodyText).not.toContain('A'.repeat(1001))
    
    vi.unstubAllEnvs()
  })

  it('returns fallback gracefully on malformed JSON response', async () => {
    vi.stubEnv('VITE_GEMINI_API_KEY', 'test_key')
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        candidates: [{
          content: {
            parts: [{ text: 'This is not valid JSON' }]
          }
        }]
      })
    })
    
    const result = await getTranslation('Help')
    
    expect(result.source).toBe('fallback')
    
    vi.unstubAllEnvs()
  })

  it('should retry-with-backoff on 429 and eventually fallback if threshold exceeded', async () => {
    vi.stubEnv('VITE_GEMINI_API_KEY', 'test_key')
    
    // Mock fetch to always return 429 Too Many Requests
    fetchMock.mockResolvedValue({
      ok: false,
      status: 429,
      statusText: 'Too Many Requests'
    })
    
    // We don't want to actually wait 5.5 seconds during the test
    vi.useFakeTimers()
    
    const promise = getTranslation('Help')
    
    // Fast-forward through the two retries (1500ms + 4000ms)
    await vi.advanceTimersByTimeAsync(1500)
    await vi.advanceTimersByTimeAsync(4000)
    
    const result = await promise
    
    // It should have tried initially + 2 retries = 3 total calls
    expect(fetchMock).toHaveBeenCalledTimes(3)
    expect(result.source).toBe('fallback')
    
    vi.useRealTimers()
    vi.unstubAllEnvs()
  })

  it('should succeed on retry if subsequent call returns 200 OK', async () => {
    vi.stubEnv('VITE_GEMINI_API_KEY', 'test_key')
    
    // First call fails with 429
    fetchMock.mockResolvedValueOnce({ ok: false, status: 429 })
    
    // Second call succeeds
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        candidates: [{
          content: {
            parts: [{
              text: '```json\n{"englishTranslation": "Where is the bathroom?", "urgencyTag": "General Request"}\n```'
            }]
          }
        }]
      })
    })
    
    vi.useFakeTimers()
    const promise = getTranslation('Donde esta el bano?')
    
    // Fast-forward past the first retry delay
    await vi.advanceTimersByTimeAsync(1500)
    
    const result = await promise
    
    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(result.source).toBe('gemini')
    expect(result.englishTranslation).toBe('Where is the bathroom?')
    
    vi.useRealTimers()
    vi.unstubAllEnvs()
  })
})

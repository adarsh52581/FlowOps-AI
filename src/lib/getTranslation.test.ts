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
})

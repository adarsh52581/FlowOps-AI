/**
 * getTranslation — Isolated Gemini AI Translator module.
 *
 * Takes a fan request (in any language) and returns the English translation
 * alongside an AI-determined urgency tag.
 */

export interface AiTranslation {
  /** The translated English text */
  englishTranslation: string
  /** The detected urgency category */
  urgencyTag: 'Medical Emergency' | 'Security Issue' | 'General Request'
  /** 'gemini' | 'fallback' — lets the UI show a subtle source label */
  source: 'gemini' | 'fallback'
}

const FALLBACK_TRANSLATION: AiTranslation = {
  englishTranslation: 'Could not connect to translation service. Please try again.',
  urgencyTag: 'General Request',
  source: 'fallback',
}

const GEMINI_API_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent'

const TIMEOUT_MS = 10_000

export function buildTranslatorPrompt(fanInput: string): string {
  return `You are a dynamic assistant for the FIFA World Cup 2026. A fan has just said the following to a volunteer working in crowd management:

"${fanInput}"

Translate this to clear, polite English so the volunteer understands exactly what the fan needs.
Then, classify the urgency into ONE of these exact three tags: "Medical Emergency", "Security Issue", or "General Request".

Return ONLY a valid, minified JSON object matching this schema exactly, with no markdown formatting or backticks:
{
  "englishTranslation": "The translated text...",
  "urgencyTag": "Medical Emergency | Security Issue | General Request"
}`
}

function parseResponseText(text: string): AiTranslation | null {
  try {
    const cleaned = text.replace(/```json/gi, '').replace(/```/g, '').trim()
    const parsed = JSON.parse(cleaned)

    if (
      !parsed ||
      typeof parsed !== 'object' ||
      typeof parsed.englishTranslation !== 'string' ||
      !['Medical Emergency', 'Security Issue', 'General Request'].includes(parsed.urgencyTag)
    ) {
      return null
    }

    return {
      englishTranslation: parsed.englishTranslation,
      urgencyTag: parsed.urgencyTag as AiTranslation['urgencyTag'],
      source: 'gemini',
    }
  } catch {
    return null
  }
}

/**
 * getTranslation — fetch a Gemini-powered translation.
 *
 * @param fanInput - The raw string input from the fan.
 * @returns Typed translation result; never throws.
 */
export async function getTranslation(fanInput: string): Promise<AiTranslation> {
  if (!fanInput || !fanInput.trim()) {
    return { ...FALLBACK_TRANSLATION, englishTranslation: 'No input provided.' }
  }

  const apiKey = import.meta.env.VITE_GEMINI_API_KEY as string | undefined
  if (!apiKey || apiKey === 'your_gemini_api_key_here') {
    console.warn('[getTranslation] No VITE_GEMINI_API_KEY set — returning fallback.')
    return FALLBACK_TRANSLATION
  }

  const prompt = buildTranslatorPrompt(fanInput)
  const retries = [1500, 4000] // retry delay backoffs in ms
  let attempt = 0
  
  while (true) {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS)

    try {
      const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        signal:  controller.signal,
        body:    JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature:     0.2,
            maxOutputTokens: 250,
          },
        }),
      })

      clearTimeout(timeoutId)

      if (response.ok) {
        interface GeminiResponse {
          candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>
        }
        const data = await response.json() as GeminiResponse
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text
        if (text) {
          const parsed = parseResponseText(text)
          if (parsed) return parsed
        }
        
        console.error('[getTranslation] Empty or unparseable response from Gemini API')
        return FALLBACK_TRANSLATION
      }

      if (response.status === 429) {
        if (attempt < retries.length) {
          const backoff = retries[attempt]
          attempt++
          console.warn(`[getTranslation] rate limited, backing off for ${backoff}ms before retry ${attempt}/${retries.length}`)
          await new Promise(resolve => setTimeout(resolve, backoff))
          continue
        } else {
          console.warn('[getTranslation] rate limit retry threshold exceeded. API unreachable, using fallback')
          return FALLBACK_TRANSLATION
        }
      }

      console.warn(`[getTranslation] API error ${response.status}: ${response.statusText}. API unreachable, using fallback`)
      return FALLBACK_TRANSLATION

    } catch (err) {
      clearTimeout(timeoutId)
      
      if (err instanceof Error && err.name === 'AbortError') {
        console.warn(`[getTranslation] Request timed out after ${TIMEOUT_MS}ms. API unreachable, using fallback`)
      } else {
        console.warn('[getTranslation] Fetch failed', err)
      }
      return FALLBACK_TRANSLATION
    }
  }
}

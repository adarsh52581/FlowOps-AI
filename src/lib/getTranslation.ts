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
  return `You are a context-aware multilingual assistant for volunteers at a FIFA World Cup stadium.
A fan has just said the following to a volunteer:

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
  
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS)

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
      const data = await response.json()
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text
      if (text) {
        const parsed = parseResponseText(text)
        if (parsed) return parsed
      }
    }
  } catch (error) {
    console.warn('[getTranslation] Fetch failed', error)
  }

  return FALLBACK_TRANSLATION
}

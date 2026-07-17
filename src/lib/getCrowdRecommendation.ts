/**
 * getCrowdRecommendation — Isolated Gemini reasoning module.
 *
 * WHY isolated (not inside the store or a React hook):
 * ARCHITECTURE.md mandates that the reasoning layer is independently testable.
 * This module has no React, no Zustand, no side-effects — it's a pure async function
 * that takes a gates snapshot and returns a typed result. Tests can call it directly
 * with a mock gates object without rendering any component.
 *
 * WHY not @google/generative-ai SDK:
 * The SDK adds ~200 KB to the bundle. For a single fetch we use the REST API directly
 * with a fetch call — smaller, no extra dependency, same result. Revisit if we need
 * streaming or multimodal inputs in Sprint 5.
 */

import type { GateData, DensityStatus } from '../data/mockCrowdData'

// ─── Return type ───────────────────────────────────────────────────────────────

export interface AiRecommendation {
  /** Short 5-8 word headline for the card header */
  headline:        string
  /** 2-4 sentence plain-English explanation of why the situation matters */
  reasoning:       string
  /** Actionable instruction for the volunteer on the ground */
  volunteerAction: string
  /** 0-100 confidence the model assigns to this recommendation */
  confidence:      number
  /** Gate IDs that are flagged as elevated (≥80%) */
  flaggedGates:    string[]
  /** Highest severity tier among the flagged gates */
  urgency:         DensityStatus
  /** ISO timestamp of when this response was generated */
  generatedAt:     string
  /** 'gemini' | 'fallback' | 'all-clear' — lets the card show a subtle source label */
  source:          'gemini' | 'fallback' | 'all-clear'
}

// ─── Hardcoded fallback (shown on API error or before first response) ──────────
// Matches the original static stub so the UI never appears blank on load.

export const FALLBACK_RECOMMENDATION: AiRecommendation = {
  headline:        'Gate D & C elevated',
  reasoning:
    'Gate D (East Stand) is at high capacity with a rapid inflow rate. Gate C (East VIP) is also above the 80% threshold. Both gates share the same metro concourse entry, which compounds the pressure.',
  volunteerAction:
    'Redirect incoming fans from Gates C and D to Gate E (South East) or Gate B (North East). Deploy volunteers at the Gate C / metro junction to intercept queues before they reach the turnstiles.',
  confidence:      88,
  flaggedGates:    ['D', 'C'],
  urgency:         'high',
  generatedAt:     new Date().toISOString(),
  source:          'fallback',
}

// ─── All-clear result (returned when no gate is above threshold) ───────────────
// A calm, reassuring message — not an error. Distinct source label for traceability.

function buildAllClearResult(): AiRecommendation {
  return {
    headline:        'All gates operating normally',
    reasoning:
      'All gates are currently below the 80% capacity threshold. No redirections are needed at this time. Continue monitoring for inflow surges.',
    volunteerAction: 'Maintain standard patrol positions. No immediate action required.',
    confidence:      99,
    flaggedGates:    [],
    urgency:         'low',
    generatedAt:     new Date().toISOString(),
    source:          'all-clear',
  }
}

// ─── Prompt builder ────────────────────────────────────────────────────────────
// WHY a separate function: makes it unit-testable — you can call buildPrompt(gates)
// and assert the output string without making a real API call.

export function buildPrompt(gates: Record<string, GateData>): string {
  const elevated = Object.values(gates)
    .filter(g => g.capacityPct >= 80)
    .sort((a, b) => b.capacityPct - a.capacityPct)

  const underCapacity = Object.values(gates)
    .filter(g => g.capacityPct < 70)
    .sort((a, b) => a.capacityPct - b.capacityPct)

  const allGatesSummary = Object.values(gates)
    .sort((a, b) => b.capacityPct - a.capacityPct)
    .map(g => `  • ${g.name} (${g.section}): ${g.capacityPct}% [${g.status}], trend ${g.trend > 0 ? '+' : ''}${g.trend}%, wait ~${g.waitMinutes} min`)
    .join('\n')

  const elevatedSummary = elevated.length > 0
    ? elevated.map(g => `${g.name} at ${g.capacityPct}% (trend ${g.trend > 0 ? '+' : ''}${g.trend}%)`).join(', ')
    : 'none'

  const underSummary = underCapacity.length > 0
    ? underCapacity.map(g => `${g.name} at ${g.capacityPct}%`).join(', ')
    : 'none'

  return `You are an AI crowd-safety assistant for a FIFA World Cup 2026 stadium (Lusail, Qatar). You are helping a volunteer co-pilot monitor real-time gate crowd density.

CURRENT GATE STATUS (live data):
${allGatesSummary}

ELEVATED GATES (≥80% capacity): ${elevatedSummary}
UNDER-CAPACITY GATES (<70%, good redirection targets): ${underSummary}

Your task: Respond ONLY with a JSON object — no markdown, no explanation outside the JSON.

Required JSON shape:
{
  "headline": "<5-8 word summary of the main concern>",
  "reasoning": "<2-4 sentences in plain English explaining why this situation is a safety concern, mentioning specific gate names and percentages>",
  "volunteerAction": "<1-2 concrete sentences telling the volunteer exactly what to do — which gates to redirect from and to, and any physical positioning>",
  "confidence": <integer 0-100 reflecting how confident you are in this recommendation given the data>
}

Constraints:
- Use only gate names and percentages from the data provided above.
- Do not make up data or infer beyond what is given.
- The volunteer action must name at least one specific destination gate (e.g. "Gate E at 73%").
- Keep each field concise: headline ≤10 words, reasoning ≤80 words, volunteerAction ≤60 words.
- If all gates are below 80%, return a calm all-clear JSON with confidence 99.
- Return ONLY the JSON object. No backtick fences, no "json" tag, no surrounding text.`
}

// ─── JSON response parser ──────────────────────────────────────────────────────
// WHY strict parse with fallback: Gemini occasionally wraps JSON in markdown
// fences even when instructed not to. Strip them defensively.

interface GeminiRawResponse {
  headline:        string
  reasoning:       string
  volunteerAction: string
  confidence:      number
}

function parseGeminiText(raw: string, gates: Record<string, GateData>): AiRecommendation | null {
  try {
    // Strip markdown fences if present (defensive — prompt says not to include them)
    const cleaned = raw
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/\s*```\s*$/i, '')
      .trim()

    const parsed = JSON.parse(cleaned) as GeminiRawResponse

    // Validate required fields exist and are the right types
    if (
      typeof parsed.headline        !== 'string' ||
      typeof parsed.reasoning       !== 'string' ||
      typeof parsed.volunteerAction !== 'string' ||
      typeof parsed.confidence      !== 'number'
    ) {
      return null
    }

    // Derive flaggedGates and urgency from the current live data (not from Gemini's text)
    // WHY: the model might name gates that are no longer elevated by the time we parse.
    // Tying these to the gates snapshot keeps the badge accurate.
    const elevated = Object.values(gates).filter(g => g.capacityPct >= 80)
    const flaggedGates = elevated.map(g => g.id)

    const maxStatus: DensityStatus = elevated.reduce<DensityStatus>((acc, g) => {
      const order: DensityStatus[] = ['low', 'medium', 'high', 'critical']
      return order.indexOf(g.status) > order.indexOf(acc) ? g.status : acc
    }, 'low')

    return {
      headline:        parsed.headline,
      reasoning:       parsed.reasoning,
      volunteerAction: parsed.volunteerAction,
      confidence:      Math.max(0, Math.min(100, Math.round(parsed.confidence))),
      flaggedGates,
      urgency:         flaggedGates.length > 0 ? maxStatus : 'low',
      generatedAt:     new Date().toISOString(),
      source:          'gemini',
    }
  } catch {
    return null
  }
}

// ─── Main export ───────────────────────────────────────────────────────────────

const GEMINI_API_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent'

/** Timeout in ms — prevent hanging UI if the API is slow */
const TIMEOUT_MS = 10_000

/**
 * getCrowdRecommendation — fetch a Gemini-powered crowd recommendation.
 *
 * @param gates  - Live gate state snapshot from useCrowdStore
 * @returns      - Typed recommendation result; never throws
 *
 * Error contract: Any network, parse, or API error returns FALLBACK_RECOMMENDATION.
 * The UI must never crash because of this function.
 */
export async function getCrowdRecommendation(
  gates: Record<string, GateData>
): Promise<AiRecommendation> {
  // Belt-and-suspenders guard: should never be undefined in production, but
  // HMR hot-reload can briefly pass undefined during module re-evaluation.
  if (!gates || typeof gates !== 'object') {
    return { ...FALLBACK_RECOMMENDATION, generatedAt: new Date().toISOString() }
  }

  // Short-circuit: if nothing is elevated, skip the API call entirely.
  // WHY: saves quota and avoids rate-limit pressure on calm periods.
  const hasElevated = Object.values(gates).some(g => g.capacityPct >= 80)
  if (!hasElevated) {
    return buildAllClearResult()
  }

  const apiKey = import.meta.env.VITE_GEMINI_API_KEY as string | undefined
  if (!apiKey || apiKey === 'your_gemini_api_key_here') {
    // Return fallback silently when running without a real key (CI / demo)
    console.warn('[getCrowdRecommendation] No VITE_GEMINI_API_KEY set — returning fallback.')
    return { ...FALLBACK_RECOMMENDATION, generatedAt: new Date().toISOString() }
  }

  const prompt = buildPrompt(gates)

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS)

  try {
    const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      signal:  controller.signal,
      body:    JSON.stringify({
        contents: [{
          parts: [{ text: prompt }],
        }],
        generationConfig: {
          temperature:     0.3,   // Low temp: consistent, factual recommendations
          maxOutputTokens: 300,   // Enough for our JSON shape; prevents runaway responses
          topP:            0.8,
        },
      }),
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      console.error(`[getCrowdRecommendation] API error ${response.status}: ${response.statusText}`)
      return { ...FALLBACK_RECOMMENDATION, generatedAt: new Date().toISOString() }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data = await response.json() as any
    const rawText: string | undefined =
      data?.candidates?.[0]?.content?.parts?.[0]?.text

    if (!rawText) {
      console.error('[getCrowdRecommendation] Empty response from Gemini API')
      return { ...FALLBACK_RECOMMENDATION, generatedAt: new Date().toISOString() }
    }

    const parsed = parseGeminiText(rawText, gates)
    if (!parsed) {
      console.error('[getCrowdRecommendation] Failed to parse Gemini response:', rawText.slice(0, 200))
      return { ...FALLBACK_RECOMMENDATION, generatedAt: new Date().toISOString() }
    }

    return parsed
  } catch (err) {
    clearTimeout(timeoutId)

    if (err instanceof Error && err.name === 'AbortError') {
      console.warn(`[getCrowdRecommendation] Request timed out after ${TIMEOUT_MS}ms`)
    } else {
      console.error('[getCrowdRecommendation] Unexpected error:', err)
    }
    return { ...FALLBACK_RECOMMENDATION, generatedAt: new Date().toISOString() }
  }
}

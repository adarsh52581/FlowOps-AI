/**
 * AiReasoningCard — Live Gemini-powered recommendation panel.
 *
 * Owns its own fetch cadence (15-20 s periodic + immediate on new critical gate).
 * The fetch logic is isolated in getCrowdRecommendation.ts and is independently
 * testable — this component only handles display and timing.
 *
 * Loading state: a subtle pulsing dot replaces the confidence badge while thinking.
 * No spinner that fights the calm aesthetic; the existing content stays visible.
 *
 * Initial state: FALLBACK_RECOMMENDATION (the previous hardcoded stub) is shown
 * until the first real API response arrives — the card never appears empty.
 */

import { Zap, AlertTriangle, ChevronDown, ChevronUp, Sparkles } from 'lucide-react'
import { useState, useEffect, useRef, useCallback } from 'react'
import {
  getCrowdRecommendation,
  FALLBACK_RECOMMENDATION,
  type AiRecommendation,
} from '../../lib/getCrowdRecommendation'
import type { GateData } from '../../data/mockCrowdData'

// ─── Props ────────────────────────────────────────────────────────────────────

interface AiReasoningCardProps {
  /** Live gate state from useCrowdStore — drives fetch cadence decisions */
  gates: Record<string, GateData>
}

// ─── Constants ────────────────────────────────────────────────────────────────

/** Periodic refresh cadence (ms) — slow enough to avoid rate limits */
const REFRESH_INTERVAL_MS = 15_000 + Math.random() * 5_000  // 15-20 s, jittered

const URGENCY_COLORS: Record<string, string> = {
  low:      '#22C55E',
  medium:   '#D97706',
  high:     '#EA580C',
  critical: '#DC2626',
}

// ─── Component ────────────────────────────────────────────────────────────────

export function AiReasoningCard({ gates }: AiReasoningCardProps) {
  const [rec, setRec]           = useState<AiRecommendation>(FALLBACK_RECOMMENDATION)
  const [loading, setLoading]   = useState(false)
  const [expanded, setExpanded] = useState(true)

  // Keep a mutable ref so setInterval callbacks always read the latest gates
  // without needing to be re-created every render.
  const gatesRef         = useRef(gates)
  useEffect(() => { gatesRef.current = gates }, [gates])

  // Track which gates were critical on the previous render to detect NEW crossings.
  const prevCriticalSet = useRef<Set<string>>(new Set())
  // Guard against overlapping fetches — if one is in-flight, skip until done.
  const fetchInFlight   = useRef(false)

  // ── Fetch wrapper ─────────────────────────────────────────────────
  // Uses gatesRef.current so it always gets the live snapshot at call time,
  // regardless of when the closure was created.
  const fetchRec = useCallback(async () => {
    if (fetchInFlight.current) return
    fetchInFlight.current = true
    setLoading(true)
    try {
      const result = await getCrowdRecommendation(gatesRef.current)
      setRec(result)
    } finally {
      setLoading(false)
      fetchInFlight.current = false
    }
  }, [])  // Stable ref — no deps needed

  // ── Periodic refresh (15–20 s) ───────────────────────────────────
  useEffect(() => {
    // Fetch once on mount so the card shows real data as soon as the key is set
    fetchRec()

    const id = setInterval(() => {
      // gatesRef.current is always the latest snapshot (updated by the effect above).
      // WHY ref: setInterval closures are created once and would otherwise read
      // stale mount-time gates for the entire lifetime of the interval.
      getCrowdRecommendation(gatesRef.current).then(result => {
        if (!fetchInFlight.current) setRec(result)
      })
    }, REFRESH_INTERVAL_MS)

    return () => clearInterval(id)
  }, [fetchRec])  // fetchRec is stable; adding it satisfies exhaustive-deps lint

  // ── Immediate trigger on NEW critical gate ───────────────────────────────
  // "whichever comes first" — if a gate crosses into critical for the first time,
  // fire an immediate fetch without waiting for the periodic cycle.
  useEffect(() => {
    // Guard: gates may be briefly undefined during HMR or before store hydration
    if (!gates || typeof gates !== 'object') return

    const currentCritical = new Set(
      Object.values(gates).filter(g => g.status === 'critical').map(g => g.id)
    )

    const newCriticalGates = [...currentCritical].filter(
      id => !prevCriticalSet.current.has(id)
    )

    if (newCriticalGates.length > 0) {
      // At least one gate has NEWLY entered critical — refresh immediately
      getCrowdRecommendation(gates).then(result => {
        if (!fetchInFlight.current) setRec(result)
      })
    }

    prevCriticalSet.current = currentCritical
  }, [gates])  // Re-run on every gate tick

  // ── Derived display values ───────────────────────────────────────────────
  const accentColor = URGENCY_COLORS[rec.urgency] ?? URGENCY_COLORS.medium

  const timestampLabel = (() => {
    const d = new Date(rec.generatedAt)
    return isNaN(d.getTime())
      ? rec.generatedAt  // legacy string like "17:24 IST"
      : d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', timeZoneName: 'short' })
  })()

  const sourceLabel =
    rec.source === 'gemini'    ? 'Gemini 2.0 Flash'  :
    rec.source === 'all-clear' ? 'All gates clear'   :
                                 'Cached estimate'

  const flaggedLabel = rec.flaggedGates.length > 0
    ? rec.flaggedGates.map(id => `Gate ${id}`).join(' · ') + ' elevated'
    : 'No gates above threshold'

  return (
    <section
      className="glass-card-accent"
      aria-label={`AI recommendation: ${rec.volunteerAction}`}
      aria-live="polite"
      aria-busy={loading}
    >
      {/* ── Header ─────────────────────────────────────────────── */}
      <button
        onClick={() => setExpanded(prev => !prev)}
        className="w-full flex items-center justify-between p-4 text-left"
        aria-expanded={expanded}
        aria-controls="ai-reasoning-body"
      >
        <div className="flex items-center gap-2.5">
          <div
            className="flex items-center justify-center w-8 h-8 rounded-lg shrink-0"
            style={{ backgroundColor: 'rgba(217,119,6,0.15)' }}
            aria-hidden="true"
          >
            <Zap size={16} style={{ color: '#D97706' }} fill="#D97706" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <p className="text-[#F5F5F5] font-semibold text-sm leading-tight">
                AI Recommendation
              </p>
              {/* Loading indicator — subtle pulsing dot, not a spinner */}
              {loading && (
                <span
                  className="inline-flex items-center gap-1"
                  aria-label="Updating…"
                  title="Updating…"
                >
                  <span
                    className="w-1.5 h-1.5 rounded-full animate-pulse"
                    style={{ backgroundColor: '#D97706' }}
                    aria-hidden="true"
                  />
                  <span
                    className="w-1.5 h-1.5 rounded-full animate-pulse"
                    style={{ backgroundColor: '#D97706', animationDelay: '0.2s' }}
                    aria-hidden="true"
                  />
                  <span
                    className="w-1.5 h-1.5 rounded-full animate-pulse"
                    style={{ backgroundColor: '#D97706', animationDelay: '0.4s' }}
                    aria-hidden="true"
                  />
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <AlertTriangle size={10} style={{ color: accentColor }} aria-hidden="true" />
              <span className="text-xs font-medium" style={{ color: accentColor }}>
                {flaggedLabel}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {/* Confidence badge — hides during loading to avoid stale number */}
          {!loading && (
            <div
              className="hidden sm:flex items-center gap-1 px-2 py-1 rounded-md"
              style={{ backgroundColor: 'rgba(21,128,61,0.15)' }}
              aria-label={`AI confidence ${rec.confidence}%`}
            >
              <span className="text-xs font-bold font-mono-data" style={{ color: '#22C55E' }}>
                {rec.confidence}%
              </span>
              <span className="text-xs" style={{ color: 'rgba(34,197,94,0.7)' }}>conf.</span>
            </div>
          )}
          {/* Expand / collapse */}
          <div style={{ color: 'rgba(245,245,245,0.4)' }} aria-hidden="true">
            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </div>
        </div>
      </button>

      {/* ── Body (collapsible) ──────────────────────────────────── */}
      {expanded && (
        <div id="ai-reasoning-body" className="px-4 pb-4">
          <div
            className="h-px w-full mb-4"
            style={{ backgroundColor: 'rgba(255,255,255,0.06)' }}
            aria-hidden="true"
          />

          {/* Reasoning text — subtle opacity during loading so content feels alive */}
          <div className="mb-4" style={{ opacity: loading ? 0.55 : 1, transition: 'opacity 400ms ease' }}>
            <p
              className="text-xs font-semibold uppercase tracking-wider mb-2"
              style={{ color: 'rgba(245,245,245,0.35)' }}
            >
              Why this matters
            </p>
            <p className="text-sm leading-relaxed" style={{ color: 'rgba(245,245,245,0.75)' }}>
              {rec.reasoning}
            </p>
          </div>

          {/* Action instruction */}
          <div
            className="rounded-lg p-3"
            style={{
              backgroundColor: 'rgba(217,119,6,0.08)',
              border: '1px solid rgba(217,119,6,0.2)',
              opacity: loading ? 0.55 : 1,
              transition: 'opacity 400ms ease',
            }}
          >
            <p
              className="text-xs font-semibold uppercase tracking-wider mb-1.5"
              style={{ color: 'rgba(217,119,6,0.7)' }}
            >
              Volunteer action
            </p>
            <p className="text-sm leading-relaxed font-medium" style={{ color: '#F5F5F5' }}>
              {rec.volunteerAction}
            </p>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between mt-3">
            <div className="flex items-center gap-1.5">
              {rec.source === 'gemini' && (
                <Sparkles size={10} style={{ color: 'rgba(217,119,6,0.5)' }} aria-hidden="true" />
              )}
              <p className="text-xs" style={{ color: 'rgba(245,245,245,0.3)' }}>
                {loading ? 'Thinking…' : `Updated ${timestampLabel} · ${sourceLabel}`}
              </p>
            </div>
            {/* Mobile confidence */}
            {!loading && (
              <div
                className="flex sm:hidden items-center gap-1 px-2 py-1 rounded-md"
                style={{ backgroundColor: 'rgba(21,128,61,0.15)' }}
                aria-label={`AI confidence ${rec.confidence}%`}
              >
                <span className="text-xs font-bold font-mono-data" style={{ color: '#22C55E' }}>
                  {rec.confidence}%
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  )
}

/**
 * AiReasoningCard — Hardcoded stub for the AI recommendation panel.
 *
 * Visually distinct from DensityCards via amber left-border accent.
 * This is the first thing a volunteer sees after the map; the amber colour
 * signals "action required" without being as alarming as red.
 *
 * In the next sprint this will be replaced by a live Gemini API response.
 */

import { Zap, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react'
import { useState } from 'react'
import type { AI_RECOMMENDATION } from '../../data/mockCrowdData'

type AiRec = typeof AI_RECOMMENDATION

interface AiReasoningCardProps {
  recommendation: AiRec
}

const URGENCY_COLORS = {
  low:      '#22C55E',
  medium:   '#D97706',
  high:     '#EA580C',
  critical: '#DC2626',
} as const

export function AiReasoningCard({ recommendation: rec }: AiReasoningCardProps) {
  const [expanded, setExpanded] = useState(true)
  const accentColor = URGENCY_COLORS[rec.urgency] ?? URGENCY_COLORS.medium

  return (
    <section
      className="glass-card-accent"
      aria-label={`AI recommendation: ${rec.action}`}
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
            <p className="text-[#F5F5F5] font-semibold text-sm leading-tight">
              AI Recommendation
            </p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <AlertTriangle size={10} style={{ color: accentColor }} aria-hidden="true" />
              <span className="text-xs font-medium" style={{ color: accentColor }}>
                {rec.triggeredBy.join(' · ')} elevated
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {/* Confidence badge */}
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
          {/* Expand / collapse */}
          <div
            style={{ color: 'rgba(245,245,245,0.4)' }}
            aria-hidden="true"
          >
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

          {/* Reasoning text */}
          <div className="mb-4">
            <p className="text-xs font-semibold uppercase tracking-wider mb-2"
              style={{ color: 'rgba(245,245,245,0.35)' }}>
              Why this matters
            </p>
            <p className="text-sm leading-relaxed" style={{ color: 'rgba(245,245,245,0.75)' }}>
              {rec.reasoning}
            </p>
          </div>

          {/* Action instruction */}
          <div
            className="rounded-lg p-3"
            style={{ backgroundColor: 'rgba(217,119,6,0.08)', border: '1px solid rgba(217,119,6,0.2)' }}
          >
            <p className="text-xs font-semibold uppercase tracking-wider mb-1.5"
              style={{ color: 'rgba(217,119,6,0.7)' }}>
              Volunteer action
            </p>
            <p className="text-sm leading-relaxed font-medium" style={{ color: '#F5F5F5' }}>
              {rec.action}
            </p>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between mt-3">
            <p className="text-xs" style={{ color: 'rgba(245,245,245,0.3)' }}>
              Updated {rec.timestamp} · Gemini reasoning stub
            </p>
            {/* Mobile confidence — visible only on small screens */}
            <div
              className="flex sm:hidden items-center gap-1 px-2 py-1 rounded-md"
              style={{ backgroundColor: 'rgba(21,128,61,0.15)' }}
              aria-label={`AI confidence ${rec.confidence}%`}
            >
              <span className="text-xs font-bold font-mono-data" style={{ color: '#22C55E' }}>
                {rec.confidence}%
              </span>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}

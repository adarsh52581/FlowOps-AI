/**
 * DensityCard — Glassmorphic gate capacity card.
 *
 * Each card is a self-contained status unit: gate name, capacity bar,
 * trend indicator, and a redirect instruction when the gate is elevated.
 * Uses role="status" + aria-label so screen readers can announce updates.
 */

import { TrendingUp, TrendingDown, Minus, ArrowRight, Clock } from 'lucide-react'
import type { GateData, DensityStatus } from '../../data/mockCrowdData'

interface DensityCardProps {
  gate: GateData
  isHighlighted?: boolean
  onClick?: () => void
}

/* Hardcoded hex — avoids JIT purge (CODING_RULES.md) */
const STATUS_CONFIG: Record<DensityStatus, {
  label: string
  textColor: string
  bgColor: string
  borderColor: string
  barColor: string
}> = {
  low: {
    label: 'Clear',
    textColor: '#22C55E',
    bgColor: 'rgba(34,197,94,0.1)',
    borderColor: 'rgba(34,197,94,0.25)',
    barColor: '#22C55E',
  },
  medium: {
    label: 'Moderate',
    textColor: '#D97706',
    bgColor: 'rgba(217,119,6,0.1)',
    borderColor: 'rgba(217,119,6,0.25)',
    barColor: '#D97706',
  },
  high: {
    label: 'High Alert',
    textColor: '#EA580C',
    bgColor: 'rgba(234,88,12,0.1)',
    borderColor: 'rgba(234,88,12,0.25)',
    barColor: '#EA580C',
  },
  critical: {
    label: 'Critical',
    textColor: '#DC2626',
    bgColor: 'rgba(220,38,38,0.1)',
    borderColor: 'rgba(220,38,38,0.25)',
    barColor: '#DC2626',
  },
}

function TrendIcon({ trend }: { trend: number }) {
  if (trend > 2)  return <TrendingUp  size={14} className="text-[#DC2626]" aria-label="capacity rising" />
  if (trend < -2) return <TrendingDown size={14} className="text-[#22C55E]" aria-label="capacity falling" />
  return <Minus size={14} className="text-[#D97706]" aria-label="capacity stable" />
}

export function DensityCard({ gate, isHighlighted, onClick }: DensityCardProps) {
  const cfg = STATUS_CONFIG[gate.status]

  /* Full-reading ARIA label so screen readers get the complete picture */
  const ariaLabel =
    `${gate.name}, ${gate.section}: ${gate.capacityPct}% capacity, status ${cfg.label}` +
    (gate.redirectTo ? `. Redirect fans to Gate ${gate.redirectTo}.` : '') +
    ` Wait time approximately ${gate.waitMinutes} minutes.`

  return (
    <article
      role="status"
      aria-label={ariaLabel}
      aria-live={gate.status === 'critical' ? 'assertive' : 'polite'}
      onClick={onClick}
      className="glass-card p-4 transition-all duration-200 cursor-pointer"
      style={{
        borderColor: isHighlighted ? cfg.borderColor : 'rgba(255,255,255,0.08)',
        boxShadow: isHighlighted
          ? `0 0 0 1px ${cfg.borderColor}, 0 4px 24px rgba(0,0,0,0.4)`
          : '0 2px 12px rgba(0,0,0,0.3)',
      }}
    >
      {/* ── Header row ──────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            {/* Gate ID badge */}
            <span
              className="inline-flex items-center justify-center w-7 h-7 rounded-lg text-xs font-bold shrink-0"
              style={{ backgroundColor: cfg.bgColor, color: cfg.textColor, fontFamily: "'JetBrains Mono', monospace" }}
              aria-hidden="true"
            >
              {gate.id}
            </span>
            <div className="min-w-0">
              <p className="text-[#F5F5F5] font-semibold text-sm leading-tight truncate">
                {gate.name}
              </p>
              <p className="text-[rgba(245,245,245,0.45)] text-xs mt-0.5 truncate">
                {gate.section}
              </p>
            </div>
          </div>
        </div>

        {/* Status badge */}
        <span
          className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-semibold shrink-0"
          style={{ backgroundColor: cfg.bgColor, color: cfg.textColor }}
          aria-hidden="true"  /* content is in ariaLabel */
        >
          {cfg.label}
        </span>
      </div>

      {/* ── Capacity bar ─────────────────────────────────────────── */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[rgba(245,245,245,0.5)] text-xs">Capacity</span>
          <div className="flex items-center gap-1.5">
            <TrendIcon trend={gate.trend} />
            <span
              className="text-sm font-bold font-mono-data"
              style={{ color: cfg.textColor }}
              aria-hidden="true"
            >
              {gate.capacityPct}%
            </span>
          </div>
        </div>
        {/* Track */}
        <div
          className="h-1.5 rounded-full overflow-hidden"
          style={{ backgroundColor: 'rgba(255,255,255,0.08)' }}
          role="presentation"
        >
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${Math.min(gate.capacityPct, 100)}%`,
              backgroundColor: cfg.barColor,
              boxShadow: `0 0 6px ${cfg.barColor}60`,
            }}
          />
        </div>
      </div>

      {/* ── Footer row ───────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-2">
        {/* Wait time */}
        <div className="flex items-center gap-1 text-[rgba(245,245,245,0.45)] text-xs">
          <Clock size={11} aria-hidden="true" />
          <span>~{gate.waitMinutes} min wait</span>
        </div>

        {/* Redirect instruction — only shown when gate is elevated */}
        {gate.redirectTo ? (
          <div
            className="flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium"
            style={{ backgroundColor: 'rgba(217,119,6,0.12)', color: '#D97706' }}
            aria-hidden="true"  /* spoken in ariaLabel */
          >
            <span>→ Gate {gate.redirectTo}</span>
            <ArrowRight size={10} />
          </div>
        ) : (
          <div
            className="text-xs"
            style={{ color: 'rgba(245,245,245,0.25)' }}
            aria-hidden="true"
          >
            No redirect
          </div>
        )}
      </div>
    </article>
  )
}

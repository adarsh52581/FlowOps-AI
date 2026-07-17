/**
 * StadiumMap — 2D SVG overhead view with colour-coded gate hotspots.
 *
 * WHY SVG not canvas: CODING_RULES.md explicitly prohibits 3D/canvas libraries.
 * WHY aria-hidden: decorative — all data is surfaced in DensityCards with full
 * ARIA labels, so screen readers get the information without duplicating it
 * in an SVG that would be hard to traverse meaningfully.
 */

import type { GateData } from '../../data/mockCrowdData'

/** Per-gate label offset so labels don't clip at edges */
const LABEL_OFFSETS: Record<string, { dx: number; dy: number }> = {
  A: { dx: 0,  dy: -10 },  // top — label above
  B: { dx: 8,  dy: -8  },  // top-right — shift right and up
  C: { dx: 10, dy:  0  },  // right — shift right, vertical centre
  D: { dx: 8,  dy:  10 },  // bottom-right — label below and right
  E: { dx: 0,  dy:  14 },  // bottom — label below
  F: { dx: -8, dy:  10 },  // bottom-left — label below and left
  G: { dx: -10,dy:  0  },  // left — shift left, vertical centre
  H: { dx: -8, dy: -8  },  // top-left — shift left and up
}

interface StadiumMapProps {
  gates: Record<string, GateData>
  highlightedGateId?: string | null
  onGateClick?: (gateId: string) => void
}

/** Maps DensityStatus to the hotspot fill colour (hardcoded hex — JIT-safe) */
const STATUS_COLORS: Record<string, { fill: string; ring: string }> = {
  low:      { fill: '#22C55E', ring: '#22C55E' },
  medium:   { fill: '#D97706', ring: '#D97706' },
  high:     { fill: '#EA580C', ring: '#EA580C' },
  critical: { fill: '#DC2626', ring: '#DC2626' },
}

/** Animation delay per gate so pulses don't all fire in sync */
const PULSE_DELAYS: Record<string, string> = {
  A: '0s', B: '0.25s', C: '0.5s', D: '0.75s',
  E: '1s',  F: '1.25s', G: '1.5s', H: '1.75s',
}

export function StadiumMap({ gates, highlightedGateId, onGateClick }: StadiumMapProps) {
  return (
    <svg
      viewBox="0 0 400 300"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full h-full"
      aria-hidden="true"   /* decorative — data is in DensityCards */
      role="presentation"
    >
      {/* ── Background fill ───────────────────────────────────── */}
      <rect width="400" height="300" fill="#080808" />

      {/* ── Outer stadium shell ───────────────────────────────── */}
      {/* Subtle glow ring for the stadium perimeter */}
      <ellipse cx="200" cy="150" rx="184" ry="134"
        fill="none" stroke="#22C55E" strokeWidth="0.5" strokeOpacity="0.15" />
      <ellipse cx="200" cy="150" rx="180" ry="130"
        fill="#111118" stroke="#1f2937" strokeWidth="1" />

      {/* ── Stands (annular region between outer and inner ovals) */}
      <ellipse cx="200" cy="150" rx="148" ry="105"
        fill="#0D0D12" stroke="#1f2937" strokeWidth="0.5" />

      {/* ── Seating pattern lines (subtle texture on the stands) */}
      {[85, 95, 105, 115, 125, 135, 145].map((rx, i) => (
        <ellipse key={i} cx="200" cy="150" rx={rx} ry={rx * (105/148)}
          fill="none" stroke="#ffffff" strokeWidth="0.3" strokeOpacity="0.04" />
      ))}

      {/* ── Pitch ─────────────────────────────────────────────── */}
      <rect x="117" y="88" width="166" height="124" rx="4"
        fill="#14532D" stroke="#15803D" strokeWidth="1" />
      {/* Pitch markings */}
      <rect x="117" y="88" width="166" height="124" rx="4"
        fill="none" stroke="#22C55E" strokeWidth="0.6" strokeOpacity="0.35" />
      {/* Halfway line */}
      <line x1="200" y1="88" x2="200" y2="212"
        stroke="#22C55E" strokeWidth="0.6" strokeOpacity="0.35" />
      {/* Centre circle */}
      <circle cx="200" cy="150" r="22"
        fill="none" stroke="#22C55E" strokeWidth="0.6" strokeOpacity="0.35" />
      {/* Centre spot */}
      <circle cx="200" cy="150" r="2" fill="#22C55E" fillOpacity="0.4" />
      {/* Penalty areas */}
      <rect x="117" y="114" width="32" height="72" rx="2"
        fill="none" stroke="#22C55E" strokeWidth="0.5" strokeOpacity="0.25" />
      <rect x="251" y="114" width="32" height="72" rx="2"
        fill="none" stroke="#22C55E" strokeWidth="0.5" strokeOpacity="0.25" />
      {/* Goal areas */}
      <rect x="117" y="128" width="16" height="44" rx="1"
        fill="none" stroke="#22C55E" strokeWidth="0.5" strokeOpacity="0.2" />
      <rect x="267" y="128" width="16" height="44" rx="1"
        fill="none" stroke="#22C55E" strokeWidth="0.5" strokeOpacity="0.2" />

      {/* ── Corner arcs ───────────────────────────────────────── */}
      {[
        { cx: 117, cy: 88 }, { cx: 283, cy: 88 },
        { cx: 117, cy: 212 }, { cx: 283, cy: 212 },
      ].map((corner, i) => (
        <circle key={i} cx={corner.cx} cy={corner.cy} r="5"
          fill="none" stroke="#22C55E" strokeWidth="0.5" strokeOpacity="0.25" />
      ))}

      {/* ── Grid / sector lines on stands (directional aids) ──── */}
      {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => {
        const rad = (angle * Math.PI) / 180
        const x1 = 200 + 148 * Math.cos(rad)
        const y1 = 150 + 105 * Math.sin(rad)
        const x2 = 200 + 180 * Math.cos(rad)
        const y2 = 150 + 130 * Math.sin(rad)
        return (
          <line key={i} x1={x1} y1={y1} x2={x2} y2={y2}
            stroke="#374151" strokeWidth="0.5" strokeOpacity="0.5" />
        )
      })}

      {/* ── Gate Hotspots ─────────────────────────────────────── */}
      {Object.values(gates).map((gate) => {
        const colors = STATUS_COLORS[gate.status] ?? STATUS_COLORS.low
        const isHighlighted = highlightedGateId === gate.id
        const isAlert = gate.status === 'critical' || gate.status === 'high'
        const delay = PULSE_DELAYS[gate.id] ?? '0s'

        return (
          <g
            key={gate.id}
            style={{ cursor: onGateClick ? 'pointer' : 'default' }}
            onClick={() => onGateClick?.(gate.id)}
          >
            {/* Outer pulsing ring — shown only for elevated gates */}
            {isAlert && (
              <circle
                cx={gate.mapX} cy={gate.mapY} r="10"
                fill={colors.ring}
                fillOpacity="0.25"
                className="gate-pulse"
                style={{ animationDelay: delay }}
              />
            )}
            {/* Secondary ring for critical — double pulse */}
            {gate.status === 'critical' && (
              <circle
                cx={gate.mapX} cy={gate.mapY} r="14"
                fill={colors.ring}
                fillOpacity="0.12"
                className="gate-pulse"
                style={{ animationDelay: `${parseFloat(delay) + 0.3}s` }}
              />
            )}
            {/* Highlight ring for selected gate */}
            {isHighlighted && (
              <circle
                cx={gate.mapX} cy={gate.mapY} r="12"
                fill="none"
                stroke="#F5F5F5"
                strokeWidth="1.5"
                strokeOpacity="0.8"
              />
            )}
            {/* Gate dot */}
            <circle
              cx={gate.mapX} cy={gate.mapY} r="5"
              fill={colors.fill}
              stroke="#0A0A0A"
              strokeWidth="1.5"
            />
            {/* Gate label — offset computed per gate to avoid edge clipping */}
            {(() => {
              const off = LABEL_OFFSETS[gate.id] ?? { dx: 0, dy: -10 }
              const anchor = off.dx < 0 ? 'end' : off.dx > 0 ? 'start' : 'middle'
              return (
                <text
                  x={gate.mapX + off.dx} y={gate.mapY + off.dy}
                  textAnchor={anchor}
                  fontSize="8"
                  fontFamily="'Inter', sans-serif"
                  fontWeight="600"
                  fill="#F5F5F5"
                  fillOpacity="0.9"
                >
                  {gate.id}
                </text>
              )
            })()}
          </g>
        )
      })}

      {/* ── "LIVE" watermark ──────────────────────────────────── */}
      <text x="200" y="296" textAnchor="middle"
        fontSize="7" fontFamily="'JetBrains Mono', monospace" letterSpacing="3"
        fill="#22C55E" fillOpacity="0.3">
        METRO-ESTADIO · LUSAIL · 2026
      </text>
    </svg>
  )
}

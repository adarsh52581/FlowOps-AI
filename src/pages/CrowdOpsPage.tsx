/**
 * CrowdOpsPage — Main volunteer dashboard.
 *
 * Layout: Status bar → SVG stadium map → AI recommendation → Gate density cards.
 * The map and cards are linked: clicking a gate card highlights it on the map.
 *
 * Data source: useCrowdStore (Zustand).
 * Ticker lifecycle: started on mount, stopped on unmount.
 * AI card: owns its own Gemini fetch cadence (15-20 s + new-critical-gate trigger).
 * This page only passes the live gates snapshot down; it does not manage AI state.
 */

import { useState, useEffect } from 'react'
import { Activity, Wifi, ChevronDown } from 'lucide-react'
import { StadiumMap } from '../components/crowd/StadiumMap'
import { DensityCard } from '../components/crowd/DensityCard'
import { AiReasoningCard } from '../components/crowd/AiReasoningCard'
import { JudgeOverride } from '../components/crowd/JudgeOverride'
import { AnimatedStat } from '../components/crowd/AnimatedStat'
import { useCrowdStore } from '../store/useCrowdStore'
import { GATE_DISPLAY_ORDER } from '../data/mockCrowdData'
import { useSummaryStats } from '../lib/useSummaryStats'
// ─── Last-updated display hook ────────────────────────────────────────────────

function useRelativeTime(epochMs: number) {
  const [label, setLabel] = useState('just now')

  useEffect(() => {
    function update() {
      const secs = Math.floor((Date.now() - epochMs) / 1000)
      setLabel(secs < 5 ? 'just now' : `${secs}s ago`)
    }
    update()
    const id = setInterval(update, 1000)
    return () => clearInterval(id)
  }, [epochMs])

  return label
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function CrowdOpsPage() {
  const [activeGateId, setActiveGateId] = useState<string | null>('D')

  // Subscribe to live store slices — each selector is granular to avoid
  // unnecessary re-renders when unrelated state changes.
  const gates       = useCrowdStore(s => s.gates)
  const lastUpdated = useCrowdStore(s => s.lastUpdated)
  const startTicker = useCrowdStore(s => s.startTicker)
  const stopTicker  = useCrowdStore(s => s.stopTicker)

  const stats       = useSummaryStats(gates)
  const updatedLabel = useRelativeTime(lastUpdated)

  // Start ticker on mount; stop on unmount — prevents timer leaks if the
  // component is conditionally rendered or the route changes.
  useEffect(() => {
    startTicker()
    return () => stopTicker()
  }, [startTicker, stopTicker])

  function handleGateSelect(id: string) {
    setActiveGateId(prev => prev === id ? null : id)
  }

  return (
    <main className="flex flex-col min-h-dvh" style={{ paddingBottom: '100px' }}>

      {/* ── Status bar ─────────────────────────────────────────── */}
      <header
        className="sticky top-0 z-40 flex items-center justify-between px-4 py-3"
        style={{
          background: 'rgba(10,10,10,0.85)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <div className="flex items-center gap-2">
          {/* App logo mark */}
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #15803D, #22C55E)' }}
            aria-hidden="true"
          >
            <Activity size={14} color="#fff" strokeWidth={2.5} />
          </div>
          <div>
            <h1
              className="text-sm font-bold leading-none"
              style={{ fontFamily: "'Calistoga', serif", color: '#F5F5F5' }}
            >
              FlowOps AI
            </h1>
            <p className="text-xs mt-0.5" style={{ color: 'rgba(245,245,245,0.4)' }}>
              Crowd Operations
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Alert summary pills — react to live store */}
          {stats.critical > 0 && (
            <div
              className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold"
              style={{ backgroundColor: 'rgba(220,38,38,0.15)', color: '#DC2626' }}
              aria-label={`${stats.critical} critical gates`}
            >
              {stats.critical} critical
            </div>
          )}
          {stats.high > 0 && (
            <div
              className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium"
              style={{ backgroundColor: 'rgba(234,88,12,0.12)', color: '#EA580C' }}
              aria-label={`${stats.high} high-alert gates`}
            >
              {stats.high} high
            </div>
          )}
          {/* Live indicator + last-updated label */}
          <div className="flex items-center gap-1.5" aria-label={`Live feed, updated ${updatedLabel}`}>
            <span
              className="w-2 h-2 rounded-full animate-pulse"
              style={{ backgroundColor: '#22C55E', boxShadow: '0 0 6px #22C55E' }}
              aria-hidden="true"
            />
            <span className="text-xs font-mono-data" style={{ color: '#22C55E' }}>LIVE</span>
          </div>
        </div>
      </header>

      {/* ── Stadium map ─────────────────────────────────────────── */}
      <section
        aria-label="Stadium gate map"
        className="relative w-full overflow-hidden"
        style={{
          height: '260px',
          background: 'radial-gradient(ellipse at center, #0D1117 0%, #080808 100%)',
        }}
      >
        {/* Subtle ambient glow */}
        <div
          className="absolute inset-0 pointer-events-none"
          aria-hidden="true"
          style={{
            background: 'radial-gradient(ellipse 70% 50% at 50% 50%, rgba(21,128,61,0.06) 0%, transparent 70%)',
          }}
        />
        <div className="absolute inset-0 p-2">
          {/* Gates prop is now live store state — SVG colours update each tick */}
          <StadiumMap
            gates={gates}
            highlightedGateId={activeGateId}
            onGateClick={handleGateSelect}
          />
        </div>

        {/* Map label overlay */}
        <div
          className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-3 py-1 rounded-full"
          style={{
            background: 'rgba(0,0,0,0.5)',
            backdropFilter: 'blur(8px)',
            border: '1px solid rgba(255,255,255,0.08)',
          }}
          aria-hidden="true"
        >
          <Wifi size={10} style={{ color: 'rgba(245,245,245,0.4)' }} />
          <span className="text-xs font-mono-data" style={{ color: 'rgba(245,245,245,0.4)', fontSize: '10px' }}>
            Tap gate to inspect · Updated {updatedLabel}
          </span>
        </div>
      </section>

      {/* ── Quick stats strip — live from store ─────────────────── */}
      <section
        className="flex items-center gap-px mx-4 mt-4 rounded-xl overflow-hidden"
        aria-label="Venue summary statistics"
        style={{ border: '1px solid rgba(255,255,255,0.07)' }}
      >
        {[
          { label: 'Avg Capacity', value: `${stats.avgCapacity}%`, color: '#F5F5F5' },
          { label: 'Gates Open',   value: `${Object.keys(gates).length} / ${Object.keys(gates).length}`, color: '#22C55E' },
          { label: 'Alerts',       value: `${stats.critical + stats.high}`,
            color: stats.critical > 0 ? '#DC2626' : stats.high > 0 ? '#D97706' : '#22C55E' },
        ].map((stat, i) => (
          <AnimatedStat key={stat.label} stat={stat} borderedRight={i < 2} />
        ))}
      </section>

      {/* ── Content area ────────────────────────────────────────── */}
      <div className="flex flex-col gap-3 px-4 mt-4">

        {/* Judge Data Override control panel */}
        <JudgeOverride />

        {/* AiReasoningCard owns its own Gemini fetch — we only pass the live gates */}
        <AiReasoningCard gates={gates} />

        {/* Section header */}
        <div className="flex items-center justify-between mt-1">
          <h2
            className="text-sm font-semibold"
            style={{ color: 'rgba(245,245,245,0.6)', letterSpacing: '0.06em', textTransform: 'uppercase', fontSize: '11px' }}
          >
            Gate Status · {Object.keys(gates).length} gates
          </h2>
          <button
            className="flex items-center gap-1 text-xs"
            style={{ color: 'rgba(245,245,245,0.3)' }}
            aria-label="Sort gates"
          >
            <ChevronDown size={12} aria-hidden="true" />
            <span>By urgency</span>
          </button>
        </div>

        {/* Gate density cards — O(1) lookup by display order */}
        <div className="flex flex-col gap-2.5" role="list" aria-label="Gate density cards">
          {GATE_DISPLAY_ORDER.map(gateId => {
            const gate = gates[gateId]
            if (!gate) return null
            return (
              <div key={gate.id} role="listitem">
                <DensityCard
                  gate={gate}
                  isHighlighted={activeGateId === gate.id}
                  onClick={() => handleGateSelect(gate.id)}
                />
              </div>
            )
          })}
        </div>
      </div>
    </main>
  )
}



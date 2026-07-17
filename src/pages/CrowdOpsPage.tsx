/**
 * CrowdOpsPage — Main volunteer dashboard.
 *
 * Layout: Status bar → SVG stadium map → AI recommendation → Gate density cards.
 * The map and cards are linked: clicking a gate card highlights it on the map
 * and vice versa. (State is local; Zustand arrives in the next sprint.)
 */

import { useState } from 'react'
import { Activity, Wifi, ChevronDown } from 'lucide-react'
import { StadiumMap } from '../components/crowd/StadiumMap'
import { DensityCard } from '../components/crowd/DensityCard'
import { AiReasoningCard } from '../components/crowd/AiReasoningCard'
import { GATES, GATE_DISPLAY_ORDER, AI_RECOMMENDATION } from '../data/mockCrowdData'

/** Summary stats derived from mock data — will be computed from Zustand in next sprint */
function useSummaryStats() {
  const gates = Object.values(GATES)
  return {
    critical: gates.filter(g => g.status === 'critical').length,
    high:     gates.filter(g => g.status === 'high').length,
    avgCapacity: Math.round(gates.reduce((acc, g) => acc + g.capacityPct, 0) / gates.length),
  }
}

export function CrowdOpsPage() {
  const [activeGateId, setActiveGateId] = useState<string | null>('D')
  const stats = useSummaryStats()

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
          {/* Alert summary pills */}
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
          {/* Live indicator */}
          <div className="flex items-center gap-1.5" aria-label="Live feed active">
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
        {/* Subtle ambient glow behind the map */}
        <div
          className="absolute inset-0 pointer-events-none"
          aria-hidden="true"
          style={{
            background: 'radial-gradient(ellipse 70% 50% at 50% 50%, rgba(21,128,61,0.06) 0%, transparent 70%)',
          }}
        />
        <div className="absolute inset-0 p-2">
          <StadiumMap
            gates={GATES}
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
            Tap gate to inspect
          </span>
        </div>
      </section>

      {/* ── Quick stats strip ───────────────────────────────────── */}
      <section
        className="flex items-center gap-px mx-4 mt-4 rounded-xl overflow-hidden"
        aria-label="Venue summary statistics"
        style={{ border: '1px solid rgba(255,255,255,0.07)' }}
      >
        {[
          { label: 'Avg Capacity', value: `${stats.avgCapacity}%`, color: '#F5F5F5' },
          { label: 'Gates Open', value: '8 / 8', color: '#22C55E' },
          { label: 'Alerts', value: `${stats.critical + stats.high}`, color: stats.critical > 0 ? '#DC2626' : '#D97706' },
        ].map((stat, i) => (
          <div
            key={stat.label}
            className="flex-1 flex flex-col items-center py-2.5"
            style={{
              background: 'rgba(15,15,15,0.6)',
              borderRight: i < 2 ? '1px solid rgba(255,255,255,0.06)' : 'none',
            }}
          >
            <span
              className="text-base font-bold font-mono-data leading-tight"
              style={{ color: stat.color }}
              aria-label={`${stat.label}: ${stat.value}`}
            >
              {stat.value}
            </span>
            <span className="text-xs mt-0.5" style={{ color: 'rgba(245,245,245,0.35)', fontSize: '10px' }}>
              {stat.label}
            </span>
          </div>
        ))}
      </section>

      {/* ── Content area ────────────────────────────────────────── */}
      <div className="flex flex-col gap-3 px-4 mt-4">

        {/* AI Reasoning Card */}
        <AiReasoningCard recommendation={AI_RECOMMENDATION} />

        {/* Section header */}
        <div className="flex items-center justify-between mt-1">
          <h2
            className="text-sm font-semibold"
            style={{ color: 'rgba(245,245,245,0.6)', letterSpacing: '0.06em', textTransform: 'uppercase', fontSize: '11px' }}
          >
            Gate Status · {Object.keys(GATES).length} gates
          </h2>
          <button
            className="flex items-center gap-1 text-xs"
            style={{ color: 'rgba(245,245,245,0.3)' }}
            aria-label="Sort gates"
          >
            <ChevronDown size={12} />
            <span>By urgency</span>
          </button>
        </div>

        {/* Gate density cards — sorted by urgency (critical first) */}
        <div className="flex flex-col gap-2.5" role="list" aria-label="Gate density cards">
          {GATE_DISPLAY_ORDER.map(gateId => {
            const gate = GATES[gateId]
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

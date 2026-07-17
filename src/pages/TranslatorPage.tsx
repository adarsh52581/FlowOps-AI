/**
 * TranslatorPage — AI Translator feature stub.
 *
 * Placeholder screen that maintains visual consistency with CrowdOpsPage.
 * Real copy — no lorem ipsum. Next sprint adds voice input + Gemini translation.
 */

import { MessageSquare, Mic, Languages, Zap } from 'lucide-react'

const UPCOMING_FEATURES = [
  {
    icon: <Mic size={18} aria-hidden="true" />,
    title: 'Voice & Text Input',
    description: 'Volunteer types or speaks the fan\'s message in any language.',
  },
  {
    icon: <Zap size={18} aria-hidden="true" />,
    title: 'Urgency Detection',
    description: 'AI classifies medical emergencies vs. casual requests before translating.',
  },
  {
    icon: <Languages size={18} aria-hidden="true" />,
    title: '40+ Languages',
    description: 'FIFA 2026 host nation languages plus all qualified nations\' primary languages.',
  },
]

export function TranslatorPage() {
  return (
    <main
      className="flex flex-col items-center min-h-dvh px-6"
      style={{ paddingBottom: '100px', paddingTop: '24px' }}
    >
      {/* Header */}
      <header className="w-full max-w-sm text-center mb-10 mt-6">
        <div
          className="mx-auto w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
          style={{
            background: 'rgba(15,15,15,0.7)',
            border: '1px solid rgba(255,255,255,0.1)',
            boxShadow: '0 0 32px rgba(34,197,94,0.08)',
          }}
          aria-hidden="true"
        >
          <MessageSquare size={28} strokeWidth={1.5} style={{ color: '#22C55E' }} />
        </div>
        <h1
          className="text-2xl mb-2"
          style={{ fontFamily: "'Calistoga', serif", color: '#F5F5F5' }}
        >
          AI Translator
        </h1>
        <p className="text-sm leading-relaxed" style={{ color: 'rgba(245,245,245,0.5)' }}>
          Context-aware multilingual assistance with urgency detection —
          launching next sprint.
        </p>
      </header>

      {/* Feature preview cards */}
      <div className="w-full max-w-sm flex flex-col gap-3" role="list" aria-label="Upcoming translator features">
        {UPCOMING_FEATURES.map((feature) => (
          <div
            key={feature.title}
            className="glass-card p-4"
            role="listitem"
            aria-label={`${feature.title}: ${feature.description}`}
          >
            <div className="flex items-start gap-3">
              <div
                className="flex items-center justify-center w-9 h-9 rounded-xl shrink-0"
                style={{ backgroundColor: 'rgba(34,197,94,0.1)', color: '#22C55E' }}
                aria-hidden="true"
              >
                {feature.icon}
              </div>
              <div>
                <p className="text-sm font-semibold" style={{ color: '#F5F5F5' }}>
                  {feature.title}
                </p>
                <p className="text-xs mt-1 leading-relaxed" style={{ color: 'rgba(245,245,245,0.45)' }}>
                  {feature.description}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Sprint label */}
      <p
        className="mt-8 text-xs text-center font-mono-data"
        style={{ color: 'rgba(245,245,245,0.2)', letterSpacing: '0.08em' }}
        aria-label="Sprint 2 feature"
      >
        SPRINT 2 · GEMINI API · FIFA WC 2026
      </p>
    </main>
  )
}

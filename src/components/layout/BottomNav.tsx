/**
 * BottomNav — Floating glassmorphic dock navigation.
 *
 * Fixed at the bottom of the viewport with safe-area padding for iOS notches.
 * Two tabs: Crowd Ops and AI Translator. Active state uses colour + filled icon;
 * inactive uses muted opacity. Full keyboard nav with focus-visible ring.
 */

import { useLocation, useNavigate } from 'react-router-dom'
import { Users, MessageSquare } from 'lucide-react'

interface NavTab {
  id: string
  label: string
  path: string
  icon: React.ReactNode
  activeIcon: React.ReactNode
}

const TABS: NavTab[] = [
  {
    id: 'crowd-ops',
    label: 'Crowd Ops',
    path: '/',
    icon: <Users size={22} strokeWidth={1.8} aria-hidden="true" />,
    activeIcon: <Users size={22} strokeWidth={2.2} aria-hidden="true" />,
  },
  {
    id: 'ai-translator',
    label: 'AI Translator',
    path: '/translator',
    icon: <MessageSquare size={22} strokeWidth={1.8} aria-hidden="true" />,
    activeIcon: <MessageSquare size={22} strokeWidth={2.2} aria-hidden="true" fill="currentColor" />,
  },
]

export function BottomNav() {
  const location = useLocation()
  const navigate = useNavigate()

  return (
    <nav
      aria-label="Main navigation"
      className="fixed bottom-0 left-0 right-0 z-50"
      style={{
        paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 12px)',
      }}
    >
      {/* Floating dock container */}
      <div className="mx-4 mb-3">
        <div
          className="flex items-stretch rounded-2xl overflow-hidden"
          style={{
            background: 'rgba(15,15,15,0.75)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid rgba(255,255,255,0.1)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.6), 0 1px 0 rgba(255,255,255,0.05) inset',
          }}
        >
          {TABS.map((tab, index) => {
            const isActive = location.pathname === tab.path
            const isFirst = index === 0
            const isLast = index === TABS.length - 1

            return (
              <button
                key={tab.id}
                id={`nav-${tab.id}`}
                role="tab"
                aria-selected={isActive}
                aria-label={tab.label}
                onClick={() => navigate(tab.path)}
                className="flex-1 flex flex-col items-center justify-center gap-1 py-3 px-4 relative transition-all duration-200"
                style={{
                  color: isActive ? '#22C55E' : 'rgba(245,245,245,0.4)',
                  borderRight: isFirst ? '1px solid rgba(255,255,255,0.06)' : 'none',
                  borderLeft: isLast ? 'none' : 'none',
                }}
              >
                {/* Active indicator bar at top */}
                {isActive && (
                  <span
                    className="absolute top-0 left-1/2 -translate-x-1/2 h-0.5 rounded-b-full transition-all duration-300"
                    style={{
                      width: '32px',
                      backgroundColor: '#22C55E',
                      boxShadow: '0 0 8px #22C55E80',
                    }}
                    aria-hidden="true"
                  />
                )}

                {/* Icon */}
                <span
                  className="transition-transform duration-200"
                  style={{ transform: isActive ? 'scale(1.08)' : 'scale(1)' }}
                >
                  {isActive ? tab.activeIcon : tab.icon}
                </span>

                {/* Label */}
                <span
                  className="text-xs font-medium tracking-wide transition-all duration-200"
                  style={{
                    fontSize: '10px',
                    letterSpacing: '0.03em',
                    opacity: isActive ? 1 : 0.7,
                    fontWeight: isActive ? 600 : 400,
                  }}
                >
                  {tab.label}
                </span>
              </button>
            )
          })}
        </div>
      </div>
    </nav>
  )
}

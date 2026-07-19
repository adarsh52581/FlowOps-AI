import { useRef, useState, useEffect } from 'react'

export interface StatItem {
  label: string
  value: string
  color: string
}

/**
 * Wraps a stat value with a subtle flash animation when the value changes.
 * Uses a CSS transition on opacity rather than a layout-shifting transform —
 * no layout shift. Respects prefers-reduced-motion by checking
 * window.matchMedia directly and skipping the transition/transform.
 */
export function AnimatedStat({ stat, borderedRight }: { stat: StatItem; borderedRight: boolean }) {
  const prevValue = useRef(stat.value)
  const [flashing, setFlashing] = useState(false)

  /** True when the user's OS/browser prefers reduced motion */
  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches

  useEffect(() => {
    if (stat.value !== prevValue.current) {
      prevValue.current = stat.value
      if (!prefersReducedMotion) {
        setFlashing(true)
        // Flash duration: 600ms — long enough to notice, short enough not to annoy
        const t = setTimeout(() => setFlashing(false), 600)
        return () => clearTimeout(t)
      }
    }
  }, [stat.value, prefersReducedMotion])

  return (
    <div
      className="flex-1 flex flex-col items-center py-2.5"
      style={{
        background: 'rgba(15,15,15,0.6)',
        borderRight: borderedRight ? '1px solid rgba(255,255,255,0.06)' : 'none',
      }}
    >
      <span
        className="text-base font-bold font-mono-data leading-tight"
        style={{
          color: stat.color,
          opacity: flashing ? 1 : 0.9,
          transform: flashing ? 'scale(1.08)' : 'scale(1)',
          transition: prefersReducedMotion
            ? 'none'
            : 'transform 300ms cubic-bezier(0.16,1,0.3,1), opacity 300ms ease',
        }}
        aria-label={`${stat.label}: ${stat.value}`}
        aria-live="polite"
      >
        {stat.value}
      </span>
      <span className="text-xs mt-0.5" style={{ color: 'rgba(245,245,245,0.35)', fontSize: '10px' }}>
        {stat.label}
      </span>
    </div>
  )
}

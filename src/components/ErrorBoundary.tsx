/**
 * ErrorBoundary — Top-level React error boundary.
 *
 * WHY a class component: React error boundaries require the getDerivedStateFromError
 * and/or componentDidCatch lifecycle methods, which are only available on class
 * components. This is one of the few legitimate uses of a class component in an
 * otherwise-functional codebase — it is NOT an inconsistency, but a React API
 * constraint. See: https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary
 *
 * Displays a calm, on-brand fallback UI (dark glassmorphic style) when an uncaught
 * render exception occurs anywhere in the component tree. No raw stack traces are
 * exposed to the user.
 */

import { Component } from 'react'
import type { ReactNode, ErrorInfo } from 'react'

interface ErrorBoundaryProps {
  children: ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('[ErrorBoundary] Uncaught render error:', error, info.componentStack)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            background: '#0A0A0A',
            padding: '2rem',
          }}
        >
          <div
            style={{
              maxWidth: '420px',
              width: '100%',
              padding: '2.5rem',
              borderRadius: '1.25rem',
              background: 'rgba(15,15,15,0.85)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              border: '1px solid rgba(255,255,255,0.08)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
              textAlign: 'center',
              fontFamily: "'Inter', -apple-system, sans-serif",
            }}
          >
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                background: 'rgba(220,38,38,0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1.25rem',
                fontSize: '1.5rem',
              }}
              aria-hidden="true"
            >
              ⚠
            </div>
            <h1
              style={{
                color: '#F5F5F5',
                fontSize: '1.125rem',
                fontWeight: 600,
                margin: '0 0 0.75rem',
              }}
            >
              Something went wrong
            </h1>
            <p
              style={{
                color: 'rgba(245,245,245,0.5)',
                fontSize: '0.875rem',
                lineHeight: 1.6,
                margin: '0 0 1.5rem',
              }}
            >
              An unexpected error occurred. Please refresh the page to continue.
            </p>
            <button
              onClick={() => window.location.reload()}
              style={{
                background: '#22C55E',
                color: '#000000',
                border: 'none',
                borderRadius: '0.75rem',
                padding: '0.75rem 2rem',
                fontSize: '0.875rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Refresh Page
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { StadiumMap } from './StadiumMap'
import type { GateData } from '../../data/mockCrowdData'

describe('StadiumMap', () => {
  const mockGates: Record<string, GateData> = {
    A: { id: 'A', name: 'Gate A', section: 'North Main', capacityPct: 85, trend: 5, status: 'critical', waitMinutes: 10 },
    B: { id: 'B', name: 'Gate B', section: 'North East', capacityPct: 40, trend: 0, status: 'medium', waitMinutes: 3 }
  }

  it('renders without crashing and displays decorative SVG', () => {
    render(<StadiumMap gates={mockGates} />)
    const svg = screen.getByRole('presentation', { hidden: true })
    expect(svg).toBeTruthy()
    expect(svg.getAttribute('aria-hidden')).toBe('true')
  })

  it('fires onGateClick when a gate group is clicked', () => {
    const handleGateClick = vi.fn()
    render(<StadiumMap gates={mockGates} onGateClick={handleGateClick} />)
    
    // Gate A's interactive group
    const gateA = screen.getByTestId('stadium-map-gate-A')
    fireEvent.click(gateA)
    
    expect(handleGateClick).toHaveBeenCalledWith('A')
  })

  it('visually highlights the selected gate', () => {
    render(<StadiumMap gates={mockGates} highlightedGateId="A" />)
    
    const gateA = screen.getByTestId('stadium-map-gate-A')
    
    // The highlight ring is rendered as a circle with stroke="#F5F5F5"
    const highlightRing = gateA.querySelector('circle[stroke="#F5F5F5"]')
    expect(highlightRing).toBeTruthy()
    
    // Ensure Gate B does NOT have the highlight ring
    const gateB = screen.getByTestId('stadium-map-gate-B')
    const highlightRingB = gateB.querySelector('circle[stroke="#F5F5F5"]')
    expect(highlightRingB).toBeFalsy()
  })
})

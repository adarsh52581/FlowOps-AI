import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { DensityCard } from './DensityCard'
import type { GateData } from '../../data/mockCrowdData'

describe('DensityCard', () => {
  const mockGate: GateData = {
    id: 'A',
    name: 'Gate A',
    section: 'North Main',
    capacityPct: 85,
    trend: 5,
    status: 'critical',
    waitMinutes: 10
  }

  it('renders gate data correctly', () => {
    render(<DensityCard gate={mockGate} isHighlighted={false} onClick={() => {}} />)
    
    expect(screen.getByText('Gate A')).toBeTruthy()
    expect(screen.getByText('85%')).toBeTruthy()
    // Using string matching for trend since there is an arrow icon
    expect(screen.getByText(/5%/)).toBeTruthy()
    expect(screen.getByText(/10\s*min/)).toBeTruthy()
  })

  it('triggers onClick when clicked', () => {
    const handleClick = vi.fn()
    render(<DensityCard gate={mockGate} isHighlighted={false} onClick={handleClick} />)
    
    // The card is an article with role="status"
    const card = screen.getByRole('status')
    fireEvent.click(card)
    
    expect(handleClick).toHaveBeenCalled()
  })
})

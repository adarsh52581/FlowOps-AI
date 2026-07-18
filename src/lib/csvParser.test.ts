import { describe, it, expect } from 'vitest'
import { parseJudgeCsv } from './csvParser'

describe('parseJudgeCsv', () => {
  it('should parse valid gates CSV content correctly', () => {
    const csv = `id,name,section,capacityPct,trend,redirectTo,waitMinutes
A,Gate A,North Main,45,-3,null,3
D,Gate D,East Stand,91,8,E,22`

    const res = parseJudgeCsv(csv)
    expect(res.success).toBe(true)
    expect(res.gates).toBeDefined()
    expect(res.gates?.A).toEqual({
      id: 'A',
      name: 'Gate A',
      section: 'North Main',
      capacityPct: 45,
      trend: -3,
      status: 'low',
      redirectTo: null,
      waitMinutes: 3,
      mapX: 200,
      mapY: 22,
    })
    expect(res.gates?.D).toEqual({
      id: 'D',
      name: 'Gate D',
      section: 'East Stand',
      capacityPct: 91,
      trend: 8,
      status: 'critical',
      redirectTo: 'E',
      waitMinutes: 22,
      mapX: 327,
      mapY: 240,
    })
  })

  it('should parse valid facilities CSV content correctly', () => {
    const csv = `id,type,label,location,waitMinutes
restroom_ne,restroom,Restrooms — North East,Concourse Level 2,8
medical_main,medical,Medical Station — Main,Gate A Concourse,0`

    const res = parseJudgeCsv(csv)
    expect(res.success).toBe(true)
    expect(res.facilities).toBeDefined()
    expect(res.facilities?.restroom_ne).toEqual({
      id: 'restroom_ne',
      type: 'restroom',
      label: 'Restrooms — North East',
      location: 'Concourse Level 2',
      waitMinutes: 8,
      status: 'medium',
    })
  })

  it('should reject empty CSV input', () => {
    const res = parseJudgeCsv('')
    expect(res.success).toBe(false)
    expect(res.error).toContain('empty')
  })

  it('should reject CSV with invalid headers', () => {
    const csv = `id,name,section,capacity,trend
A,Gate A,North Main,45,-3`
    const res = parseJudgeCsv(csv)
    expect(res.success).toBe(false)
    expect(res.error).toContain('headers')
  })

  it('should reject rows with missing required columns', () => {
    const csv = `id,name,section,capacityPct,trend
A,Gate A,North Main,45` // trend is missing
    const res = parseJudgeCsv(csv)
    expect(res.success).toBe(false)
    expect(res.error).toContain('Column count')
  })

  it('should reject out-of-bounds capacityPct values (>100)', () => {
    const csv = `id,name,section,capacityPct,trend
A,Gate A,North Main,105,-3`
    const res = parseJudgeCsv(csv)
    expect(res.success).toBe(false)
    expect(res.error).toContain('capacityPct')
    expect(res.error).toContain('between 0 and 100')
  })

  it('should reject out-of-bounds capacityPct values (<0)', () => {
    const csv = `id,name,section,capacityPct,trend
A,Gate A,North Main,-5,-3`
    const res = parseJudgeCsv(csv)
    expect(res.success).toBe(false)
    expect(res.error).toContain('capacityPct')
    expect(res.error).toContain('between 0 and 100')
  })

  it('should reject non-numeric capacityPct values', () => {
    const csv = `id,name,section,capacityPct,trend
A,Gate A,North Main,high,-3`
    const res = parseJudgeCsv(csv)
    expect(res.success).toBe(false)
    expect(res.error).toContain('capacityPct')
    expect(res.error).toContain('must be a number')
  })

  it('should reject invalid facility types', () => {
    const csv = `id,type,label,location,waitMinutes
stall,arcade,Gaming Arcade,Ground Floor,5`
    const res = parseJudgeCsv(csv)
    expect(res.success).toBe(false)
    expect(res.error).toContain('type')
    expect(res.error).toContain('must be one of')
  })
})

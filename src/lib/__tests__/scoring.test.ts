import { describe, it, expect } from 'vitest'
import { calcScore, calcDelta, scoreTagClass, scoreLabel } from '../scoring'

describe('calcScore', () => {
  it('multiplies impact by likelihood', () => {
    expect(calcScore(3, 4)).toBe(12)
  })
  it('returns null when impact is null', () => {
    expect(calcScore(null, 4)).toBeNull()
  })
  it('returns null when likelihood is null', () => {
    expect(calcScore(3, null)).toBeNull()
  })
})

describe('calcDelta', () => {
  it('calculates percentage reduction', () => {
    expect(calcDelta(20, 10)).toBe(-50)
  })
  it('calculates percentage increase', () => {
    expect(calcDelta(10, 15)).toBe(50)
  })
  it('returns null when pre is null', () => {
    expect(calcDelta(null, 5)).toBeNull()
  })
  it('returns null when post is null', () => {
    expect(calcDelta(10, null)).toBeNull()
  })
  it('returns 0 when pre and post are equal', () => {
    expect(calcDelta(10, 10)).toBe(0)
  })
})

describe('scoreTagClass', () => {
  it('returns grey for null', () => {
    expect(scoreTagClass(null)).toBe('nhsuk-tag--grey')
  })
  it('returns green for score ≤ 4', () => {
    expect(scoreTagClass(1)).toBe('nhsuk-tag--green')
    expect(scoreTagClass(4)).toBe('nhsuk-tag--green')
  })
  it('returns yellow for score 5–9', () => {
    expect(scoreTagClass(5)).toBe('nhsuk-tag--yellow')
    expect(scoreTagClass(9)).toBe('nhsuk-tag--yellow')
  })
  it('returns orange for score 10–16', () => {
    expect(scoreTagClass(10)).toBe('nhsuk-tag--orange')
    expect(scoreTagClass(16)).toBe('nhsuk-tag--orange')
  })
  it('returns red for score > 16', () => {
    expect(scoreTagClass(17)).toBe('nhsuk-tag--red')
    expect(scoreTagClass(25)).toBe('nhsuk-tag--red')
  })
})

describe('scoreLabel', () => {
  it('returns Not scored for null', () => {
    expect(scoreLabel(null)).toBe('Not scored')
  })
  it('returns Low for score ≤ 4', () => {
    expect(scoreLabel(4)).toBe('Low')
  })
  it('returns Medium for score 5–9', () => {
    expect(scoreLabel(9)).toBe('Medium')
  })
  it('returns High for score 10–16', () => {
    expect(scoreLabel(16)).toBe('High')
  })
  it('returns Critical for score > 16', () => {
    expect(scoreLabel(25)).toBe('Critical')
  })
})

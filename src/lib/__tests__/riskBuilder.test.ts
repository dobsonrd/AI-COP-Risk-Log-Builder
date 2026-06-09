import { describe, it, expect } from 'vitest'
import { buildRiskLog } from '../riskBuilder'
import type { QuestionnaireAnswers, Risk } from '../../types'

const allZero: QuestionnaireAnswers = {
  q1: 0, q2: 0, q3: 0, q4: 0, q5: 0,
  q6: 0, q7: 0, q8: 0, q9: 0, q10: 0,
}

const withQ1 = (n: number): QuestionnaireAnswers => ({ ...allZero, q1: n })

describe('buildRiskLog', () => {
  it('always includes modules 98 and 99 regardless of answers', () => {
    const risks = buildRiskLog(allZero)
    expect(risks.some(r => r.riskModule === '98 LIVE VERIFICATION')).toBe(true)
    expect(risks.some(r => r.riskModule === '99 LIVE PERFORMANCE')).toBe(true)
  })

  it('excludes optional modules when their answer is 0', () => {
    const risks = buildRiskLog(allZero)
    expect(risks.some(r => r.riskModule === '00 DESIGN & DEVELOPMENT')).toBe(false)
    expect(risks.some(r => r.riskModule === '01 STRUCTURED DATA')).toBe(false)
  })

  it('includes module 00 risks when q1 = 1', () => {
    const risks = buildRiskLog(withQ1(1))
    expect(risks.some(r => r.riskModule === '00 DESIGN & DEVELOPMENT')).toBe(true)
  })

  it('produces two sets of module 00 risks when q1 = 2', () => {
    const risks = buildRiskLog(withQ1(2))
    const mod00 = risks.filter(r => r.riskModule === '00 DESIGN & DEVELOPMENT')
    const instance1 = mod00.filter(r => r.id.includes('-1-'))
    const instance2 = mod00.filter(r => r.id.includes('-2-'))
    expect(instance1.length).toBeGreaterThan(0)
    expect(instance2.length).toBeGreaterThan(0)
    expect(instance2.length).toBe(instance1.length)
  })

  it('assigns default values to new risks', () => {
    const risks = buildRiskLog(withQ1(1))
    const r = risks.find(r => r.riskModule === '00 DESIGN & DEVELOPMENT')!
    expect(r.inScope).toBe('Y')
    expect(r.mitigated).toBe('N')
    expect(r.status).toBe('Open')
    expect(r.impactScore).toBeNull()
    expect(r.preMitigationLikelihood).toBeNull()
  })

  it('preserves existing risk data on rebuild', () => {
    const initial = buildRiskLog(withQ1(1))
    const target = initial.find(r => r.riskModule === '00 DESIGN & DEVELOPMENT')!
    const edited: Risk = { ...target, impactScore: 4, preMitigationLikelihood: 3, mitigationsInPlace: 'Reviewed' }

    const rebuilt = buildRiskLog(withQ1(1), [edited])
    const preserved = rebuilt.find(r => r.id === target.id)!
    expect(preserved.impactScore).toBe(4)
    expect(preserved.preMitigationLikelihood).toBe(3)
    expect(preserved.mitigationsInPlace).toBe('Reviewed')
  })

  it('all risks have required fields populated from templates', () => {
    const risks = buildRiskLog({ ...allZero, q1: 1, q6: 1 })
    for (const r of risks) {
      expect(r.id).toBeTruthy()
      expect(r.riskTitle).toBeTruthy()
      expect(r.riskModule).toBeTruthy()
      expect(r.riskArea).toBeTruthy()
    }
  })
})

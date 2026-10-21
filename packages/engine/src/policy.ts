import type { AgeBand, Context, Situation } from '@cooker/shared'

export interface Policy {
  W: { interest: number; style: number; motive: number; evidence: number; reality: number }
  displayK: number
  cashFirst: boolean
  stepRules: string[]
}

// life-stage psychology as weights + step rules (Erikson / Super, simplified)
export function stagePolicy(ageBand: AgeBand, situation: Situation, dependents = false): Policy {
  const W = { interest: 0.3, style: 0.25, motive: 0.15, evidence: 0.2, reality: 0.1 }
  let displayK = 3
  const stepRules: string[] = []
  if (ageBand === 'UNDER18') {
    W.interest += 0.1; W.evidence -= 0.1; displayK = 5
    stepRules.push('FREE_ONLY', 'SCHOOL_COMPATIBLE')
  } else if (ageBand === '25-39') {
    W.reality += 0.05
  } else if (ageBand === '40+') {
    W.evidence += 0.1; W.interest -= 0.1
    stepRules.push('NO_START_FROM_ZERO')
  }
  if (situation === 'WORKING') stepRules.push('SIDE_START_15MIN')
  if (situation === 'SCHOOL') stepRules.push('SCHOOL_COMPATIBLE')
  const total = W.interest + W.style + W.motive + W.evidence + W.reality
  for (const k of Object.keys(W) as (keyof typeof W)[]) W[k] /= total
  const cashFirst = situation === 'FINISHED_NO_WORK' || dependents
  return { W, displayK, cashFirst, stepRules: [...new Set(stepRules)] }
}

export const policyFor = (ctx: Context): Policy => stagePolicy(ctx.ageBand, ctx.situation, ctx.dependents ?? false)

// R9: under-18 contact only with a guardian. Everything still works with contact = false.
export function canStoreContact(ageBand: AgeBand, consent: { contact: boolean; guardian?: boolean | null }): boolean {
  if (!consent.contact) return false
  if (ageBand === 'UNDER18' && consent.guardian !== true) return false
  return true
}
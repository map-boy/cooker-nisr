import { DIMS, RELIABILITY, clamp, sign, type Confidence, type Context, type Dim, type Flag, type Group, type Source } from '@cooker/shared'

export interface Evidence {
  d: Dim
  signal: number
  weight: number
  source: Source
  quality: number
  card?: { s: number; sign: number } // card answers can be replayed after bias correction
}

export interface HistoryRow { id: string; value: string; ms: number }

export interface State {
  ctx: Context
  mu: Record<Dim, number>   // best guess  -1..+1
  vr: Record<Dim, number>   // how unsure  (0,1]   1 = know nothing
  log: Evidence[]
  practiced: Record<string, number>
  asked: string[]
  history: HistoryRow[]
  rawCards: { id: string; s: number }[]
  skips: Partial<Record<Group, number>>
  flags: Flag[]
  qGlobal: number
  cap: Confidence
  hardExclude: string[]
  reality?: Record<string, number>
  outcomes?: Record<string, { liked: number; disliked: number }>
  weightCap?: Record<string, number>
  forcedNext: boolean
  later: boolean
  finalized: boolean
}

const fill = (v: number): Record<Dim, number> => Object.fromEntries(DIMS.map((d) => [d, v])) as Record<Dim, number>

// flat, honest start: mu = 0, var = 1 for every dimension
export function initState(ctx: Context): State {
  return {
    ctx, mu: fill(0), vr: fill(1), log: [], practiced: {}, asked: [], history: [], rawCards: [], skips: {},
    flags: [], qGlobal: 1, cap: 'HIGH', hardExclude: [], forcedNext: false, later: false, finalized: false,
  }
}

// one clear tap on a clear card is worth more than 'one unit' of evidence; tune with pilot data
export const PRECISION_SCALE = 2

function applyOne(mu: Record<Dim, number>, vr: Record<Dim, number>, e: Evidence, acq = 0, boost = 1): void {
  const signal = acq !== 0 && e.card ? clamp(e.card.s - 0.8 * acq, -1, 1) * e.card.sign : e.signal
  const weight = e.source === 'FORCED' ? e.weight * boost : e.weight
  const pObs = PRECISION_SCALE * weight * RELIABILITY[e.source] * e.quality   // precision of this observation
  const pOld = 1 / vr[e.d]
  const pNew = pOld + pObs
  mu[e.d] = (mu[e.d] * pOld + signal * pObs) / pNew          // precision-weighted average
  vr[e.d] = 1 / pNew                                         // every answer makes us surer
}

export function addEvidence(st: State, e: Omit<Evidence, 'quality'> & { quality?: number }): void {
  const ev: Evidence = { ...e, quality: e.quality ?? 1 }
  st.log.push(ev)
  applyOne(st.mu, st.vr, ev)
}

// rebuild mu/vr from the evidence log (used for acquiescence replay)
export function fold(log: Evidence[], opts: { acq?: number; boost?: number } = {}): { mu: Record<Dim, number>; vr: Record<Dim, number> } {
  const mu = fill(0)
  const vr = fill(1)
  for (const e of log) applyOne(mu, vr, e, opts.acq ?? 0, opts.boost ?? 1)
  return { mu, vr }
}

// unsure -> pulled toward neutral, never over-claims
export const muEff = (mu: Record<Dim, number>, vr: Record<Dim, number>, d: Dim): number => mu[d] * (1 - Math.min(vr[d], 1))

export { sign }
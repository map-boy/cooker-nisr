import {
  ANSWER_VALUE, CONF_RANK, clamp, sign, RIASEC, MOTIVES, STYLE_DIMS,
  type Answer, type Confidence, type Content, type Dim, type Group, type Item, type Response, type Source,
} from '@cooker/shared'
import type { Policy } from './policy'
import { bootstrap, rank } from './score'
import { addEvidence, fold, type State } from './state'

export const MIN_CARDS = 14
export const MAX_CARDS = 30
export const OVERLAP_MIN = 0.8   // top-3 must survive re-drawing what we are unsure about
export const KEY_VAR_MEAN = 0.5   // mean uncertainty of the dimensions that matter (tune with pilot data)

const SOURCE: Record<Group, Source | null> = {
  ENJOY: 'ENJOY', PRACTICE: 'PRACTICE', STYLE: 'STYLE', MOTIVE: 'MOTIVE', EFFICACY: 'EFFICACY', ASPIRE: 'ASPIRE', DEALBREAKER: null,
}

export interface Opts { reviewed?: (textKey: string) => boolean }
const itemKeys = (i: Item): string[] => (i.kind === 'PICK2' ? [i.a!.textKey, i.b!.textKey] : [i.textKey])

// ---------- joy map: revealed behavior (what you DO) ----------
export type Freq = 'DAILY' | 'WEEKLY' | 'SOMETIMES'
export type Output = 'FOR_OTHERS' | 'MADE' | 'ONLY_ME'
const FREQ_W: Record<Freq, number> = { DAILY: 1, WEEKLY: 0.6, SOMETIMES: 0.3 }
const OUT_W: Record<Output, number> = { FOR_OTHERS: 1, MADE: 0.7, ONLY_ME: 0.3 }

export function applyJoyMap(st: State, content: Pick<Content, 'tiles'>, picks: { tile: string; freq: Freq; output: Output }[], helped: string[] = []): void {
  const byId = new Map(content.tiles.map((t) => [t.id, t]))
  for (const pk of picks.slice(0, 5)) {
    const t = byId.get(pk.tile)
    if (!t) continue
    const ev = 0.5 * FREQ_W[pk.freq] + 0.5 * OUT_W[pk.output]
    for (const [d, w] of Object.entries(t.loads) as [Dim, number][]) {
      addEvidence(st, { d, signal: sign(w), weight: Math.abs(w) * (0.5 + ev), source: 'PRACTICE' })
    }
    st.practiced[t.id] = Math.max(st.practiced[t.id] ?? 0, ev)
  }
  for (const id of helped.slice(0, 3)) {
    const t = byId.get(id)
    if (!t) continue
    for (const [d, w] of Object.entries(t.loads) as [Dim, number][]) {
      addEvidence(st, { d, signal: sign(w), weight: 0.8 * Math.abs(w), source: 'PRACTICE' })
    }
    st.practiced[t.id] = Math.max(st.practiced[t.id] ?? 0, 0.7)
  }
}

// ---------- answer quality (reads, rushes, twins, traps) ----------
const partnerOf = (content: Pick<Content, 'items'>, item: Item): string | undefined =>
  item.twinOf ?? content.items.find((i) => i.twinOf === item.id)?.id

function allSame(values: string[]): boolean {
  return values.length >= 8 && values.every((v) => v === values[0] && v !== 'SKIP')
}

export function fatigue(st: State): boolean {
  const h = st.history
  if (st.later) return true
  if (allSame(h.slice(-8).map((r) => r.value))) return true
  const ms = h.slice(-6).map((r) => r.ms).sort((a, b) => a - b)
  return ms.length === 6 && (ms[2] + ms[3]) / 2 < 400
}

function assessQuality(st: State, content: Pick<Content, 'items'>, item: Item, value: Response, ms: number): number {
  let q = 1
  if (ms < 400) q *= 0.5                                                 // didn't read (tune with pilot data)
  if (allSame([...st.history.slice(-7).map((r) => r.value), value])) { q *= 0.6; st.forcedNext = true }
  if (item.kind === 'TRAP' && value !== 'SKIP') {
    const s = ANSWER_VALUE[value as Answer]
    const wrong = (item.expect === 'NO' && s > 0) || (item.expect === 'YES' && s < 0)
    if (wrong) { if (!st.flags.includes('CARELESS')) st.flags.push('CARELESS'); st.qGlobal *= 0.7 }
  }
  const pid = partnerOf(content, item)
  const earlier = pid ? st.rawCards.find((r) => r.id === pid) : undefined
  if (earlier && value !== 'SKIP' && item.kind === 'CARD') {
    const s = ANSWER_VALUE[value as Answer]
    if (Math.abs(s - -earlier.s) > 1.2) { if (!st.flags.includes('INCONSISTENT')) st.flags.push('INCONSISTENT'); q *= 0.7 }
  }
  return q
}

// ---------- apply one answer ----------
export function submit(st: State, content: Pick<Content, 'items'>, item: Item, value: Response, ms: number): void {
  const q = assessQuality(st, content, item, value, ms)
  st.asked.push(item.id)
  st.history.push({ id: item.id, value, ms })
  if (value === 'SKIP') { st.skips[item.group] = (st.skips[item.group] ?? 0) + 1; return }
  if (item.kind === 'PICK2') {
    st.forcedNext = false
    const win = value === 'A' ? item.a! : item.b!
    const lose = value === 'A' ? item.b! : item.a!
    for (const [d, w] of Object.entries(win.loads) as [Dim, number][]) addEvidence(st, { d, signal: sign(w), weight: Math.abs(w), source: 'FORCED', quality: q })
    for (const [d, w] of Object.entries(lose.loads) as [Dim, number][]) addEvidence(st, { d, signal: -sign(w), weight: Math.abs(w), source: 'FORCED', quality: q })
    return
  }
  if (item.kind === 'TRAP') return
  const s = ANSWER_VALUE[value as Answer]
  if (item.group === 'DEALBREAKER') {
    if (value === 'NO') for (const id of item.excludes ?? []) if (!st.hardExclude.includes(id)) st.hardExclude.push(id)
    return
  }
  const source = SOURCE[item.group]!
  for (const [d, w] of Object.entries(item.loads) as [Dim, number][]) {
    addEvidence(st, { d, signal: s * sign(w), weight: Math.abs(w), source, quality: q, card: { s, sign: sign(w) } })
  }
  st.rawCards.push({ id: item.id, s })
}

// ---------- which question next? the one that settles what we still don't know ----------
function pathValue(p: Content['paths'][number], d: Dim): number {
  if ((RIASEC as readonly string[]).includes(d)) return p.interest[d as (typeof RIASEC)[number]] ?? 0
  if ((STYLE_DIMS as readonly string[]).includes(d)) { const s = p.style[d as (typeof STYLE_DIMS)[number]]; return s ? s[0] * s[1] : 0 }
  return p.motives[d as (typeof MOTIVES)[number]] ?? 0
}
const loadsOf = (i: Item): Partial<Record<Dim, number>> => (i.kind === 'PICK2' ? { ...i.a!.loads, ...i.b!.loads } : i.loads)

export function pickNextItem(st: State, content: Content, policy: Policy, opts: Opts = {}): Item | null {
  const reviewed = opts.reviewed ?? (() => true)
  const done = new Set(st.asked)
  const pool = content.items.filter((i) => !done.has(i.id) && itemKeys(i).every(reviewed))
  if (!pool.length) return null
  const n = st.asked.length
  const byId = new Map(content.items.map((i) => [i.id, i]))
  const askedItems = st.asked.map((id) => byId.get(id)!).filter(Boolean)

  // forced rules (override score)
  if (n < 3) {
    const themes = new Set(askedItems.map((i) => i.theme))
    const w = pool.find((i) => i.warm && !themes.has(i.theme))
    if (w) return w
  }
  const leadersScored = rank(st, content, policy).slice(0, 6)
  const leaderIds = new Set(leadersScored.map((s) => s.path.id))
  const best = (list: Item[]): Item | null => {
    if (!list.length) return null
    return list.map((i) => ({ i, s: score(i) })).sort((a, b) => b.s - a.s || (a.i.id < b.i.id ? -1 : 1))[0].i
  }
  const recent3 = askedItems.slice(-3)
  const spread = (d: Dim) => {
    const v = leadersScored.map((s) => pathValue(s.path, d))
    return Math.max(...v) - Math.min(...v)
  }
  const score = (i: Item): number => {
    let sep = 0
    for (const [d, w] of Object.entries(loadsOf(i)) as [Dim, number][]) sep += Math.abs(w) * st.vr[d] * spread(d)
    const shared = recent3.reduce((a, r) => a + Object.keys(loadsOf(r)).filter((d) => d in loadsOf(i)).length, 0)
    const sameGroup = askedItems.filter((r) => r.group === i.group).length
    return sep - 0.4 * shared + 0.2 * i.fun + 0.1 * (1 - sameGroup / Math.max(n, 1))
  }

  const pos = n + 1
  if (st.forcedNext || pos % 5 === 0) { const p = best(pool.filter((i) => i.kind === 'PICK2')); if (p) return p }
  if (n >= 6 && pos % 7 === 0) {
    for (const r of st.rawCards) {
      const it = byId.get(r.id)!
      const pid = it.twinOf ?? content.items.find((x) => x.twinOf === it.id)?.id
      const twin = pid ? pool.find((i) => i.id === pid) : undefined
      if (twin) return twin
    }
  }
  if (n === 7 || n === 17 || n === 26) { const t = pool.find((i) => i.kind === 'TRAP'); if (t) return t }

  const last2Heavy = askedItems.slice(-2).length === 2 && askedItems.slice(-2).every((i) => i.heavy)
  const recent5 = new Set(st.asked.slice(-5))
  const cands = pool.filter((i) => {
    if (i.kind !== 'CARD') return false
    if (i.group === 'DEALBREAKER') return (i.excludes ?? []).some((id) => leaderIds.has(id) && !st.hardExclude.includes(id))
    if (last2Heavy && i.heavy) return false
    const pid = i.twinOf ?? content.items.find((x) => x.twinOf === i.id)?.id
    if (pid && recent5.has(pid)) return false
    return true
  })
  return best(cands) ?? best(pool.filter((i) => i.kind === 'PICK2')) ?? null
}

// ---------- stop by RULE, not by a fixed count ----------
export function shouldStop(st: State, content: Content, policy: Policy): boolean {
  const n = st.asked.length
  if (n < MIN_CARDS) return false
  if (n >= MAX_CARDS) return true
  if (fatigue(st)) return true
  const ranked = rank(st, content, policy).slice(0, 6)
  const key = new Set<Dim>()
  for (const s of ranked) {
    for (const r of RIASEC) if ((s.path.interest[r] ?? 0) >= 0.5) key.add(r)
    for (const d of STYLE_DIMS) if ((s.path.style[d]?.[1] ?? 0) >= 0.5) key.add(d)
    for (const m of MOTIVES) if ((s.path.motives[m] ?? 0) >= 0.5) key.add(m)
  }
  const stab = bootstrap(st, content, policy, 60)
  const meanVar = [...key].reduce((a, d) => a + st.vr[d], 0) / Math.max(key.size, 1)
  return stab.top3Overlap >= OVERLAP_MIN && meanVar < KEY_VAR_MEAN
}

// ---------- remove yes-saying, mark low-quality sessions ----------
const minConf = (a: Confidence, b: Confidence): Confidence => (CONF_RANK[a] <= CONF_RANK[b] ? a : b)

export function finalizeState(st: State, content: Pick<Content, 'items'>): State {
  // Yes-saying is measured on reverse-keyed twins: an honest person says YES to one and NO to the other (sum ~0).
  // Averaging ALL cards would punish honest people whose questions were chosen to match what they like.
  const byId = new Map(content.items.map((i) => [i.id, i]))
  const sOf = new Map(st.rawCards.map((r) => [r.id, r.s]))
  const pairs: number[] = []
  for (const r of st.rawCards) {
    const t = byId.get(r.id)?.twinOf
    if (t && sOf.has(t)) pairs.push((r.s + sOf.get(t)!) / 2)
  }
  let acq = 0
  if (pairs.length >= 2) acq = pairs.reduce((a, b) => a + b, 0) / pairs.length
  else if (st.rawCards.length >= 8) { const m = st.rawCards.reduce((a, r) => a + r.s, 0) / st.rawCards.length; acq = Math.abs(m) > 0.6 ? m : 0 }
  if (Math.abs(acq) > 0.35) {
    st.flags.push(acq > 0 ? 'YES_SAYER' : 'NO_SAYER')
    const f = fold(st.log, { acq, boost: 1.5 })   // replay cards without the bias; trust forced pairs more
    st.mu = f.mu; st.vr = f.vr
    st.cap = minConf(st.cap, 'MEDIUM')
  }
  if (st.qGlobal < 0.6) { st.cap = 'LOW'; if (!st.flags.includes('REDO')) st.flags.push('REDO') }
  if (fatigue(st)) { st.cap = 'LOW'; if (!st.flags.includes('FATIGUE')) st.flags.push('FATIGUE') }
  st.finalized = true
  return st
}

// ---------- quick ranking summary (full matching, lanes and reasons arrive in Stage 5) ----------
export function quickMatch(st: State, content: Content, policy: Policy) {
  const ranked = rank(st, content, policy)
  const stab = bootstrap(st, content, policy, 100)
  const conf: Record<string, Confidence> = {}
  for (const s of ranked) {
    const v = stab.stability[s.path.id] ?? 0
    conf[s.path.id] = minConf(v >= 0.8 ? 'HIGH' : v >= 0.5 ? 'MEDIUM' : 'LOW', st.cap)
  }
  return { ranked, top: ranked.slice(0, policy.displayK), stability: stab.stability, top3Overlap: stab.top3Overlap, conf, flags: st.flags, cap: st.cap }
}

export const runStep = (st: State, content: Content, policy: Policy, opts?: Opts): Item | null =>
  shouldStop(st, content, policy) ? null : pickNextItem(st, content, policy, opts)

export { clamp }
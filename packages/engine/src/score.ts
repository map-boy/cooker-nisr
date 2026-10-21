import { DIMS, MOTIVES, RIASEC, STYLE_DIMS, clamp, type Content, type Context, type Dim, type Path, type Tile } from '@cooker/shared'
import type { Policy } from './policy'
import { gauss, hash, mulberry32 } from './rng'
import type { State } from './state'

export interface Parts { fi: number; fs: number; fm: number; fe: number; fr: number; feas: number; unc: number; dm: number }
export interface Scored { path: Path; score: number; parts: Parts }
export interface View { mu: Record<Dim, number>; vr: Record<Dim, number>; practiced: Record<string, number>; reality?: Record<string, number>; outcomes?: Record<string, { liked: number; disliked: number }>; weightCap?: Record<string, number>; hardExclude?: string[] }

// soft penalty, never a wall
export function feasibility(ctx: Context, p: Path): number {
  let f = 1
  for (const b of Object.keys(p.barrier) as (keyof Path['barrier'])[]) {
    const gap = Math.max(0, p.barrier[b] - ctx.capital[b])
    f *= 1 - 0.25 * gap
  }
  return Math.max(f, 0.05)
}

const dimsOf = (p: Path): Dim[] => [
  ...RIASEC.filter((r) => (p.interest[r] ?? 0) > 0),
  ...(Object.keys(p.style) as Dim[]),
  ...(Object.keys(p.motives) as Dim[]),
]

export function scorePaths(view: View, ctx: Context, policy: Policy, content: Pick<Content, 'paths' | 'tiles'>): Scored[] {
  const me = (d: Dim) => view.mu[d] * (1 - Math.min(view.vr[d], 1))
  const out: Scored[] = content.paths.map((p) => {
    let dot = 0, na = 0, nb = 0
    for (const r of RIASEC) { const a = me(r), b = p.interest[r] ?? 0; dot += a * b; na += a * a; nb += b * b }
    const cos = na === 0 || nb === 0 ? 0 : dot / Math.sqrt(na * nb)
    const fi = (cos + 1) / 2

    let num = 0, den = 0
    for (const d of STYLE_DIMS) { const s = p.style[d]; if (!s) continue; num += (s[1] * Math.abs(me(d) - s[0])) / 2; den += s[1] }
    const fs = den ? 1 - num / den : 0.5

    let mnum = 0, mden = 0
    for (const m of MOTIVES) { const w = p.motives[m] ?? 0; mnum += w * me(m); mden += Math.abs(w) }
    const fm = mden ? (mnum / mden + 1) / 2 : 0.5

    let ev = 0
    for (const t of content.tiles as Tile[]) if (view.practiced[t.id] && t.tags.some((x) => p.tags.includes(x))) ev += view.practiced[t.id]
    const oc = view.outcomes?.[p.id]; const fe = clamp(ev / 2 + 0.3 * (oc?.liked ?? 0) - 0.4 * (oc?.disliked ?? 0), 0, 1)
    const fr = view.reality?.[p.id] ?? 0.5

    const W = policy.W
    const raw0 = W.interest * fi + W.style * fs + W.motive * fm + W.evidence * fe + W.reality * fr
    const raw = Math.min(raw0, view.weightCap?.[p.id] ?? 1)
    const ds = dimsOf(p)
    const unc = ds.reduce((a, d) => a + view.vr[d], 0) / Math.max(ds.length, 1)
    const feas = feasibility(ctx, p)
    const dm = p.demand ?? 0.5
    const score = clamp(raw - 0.3 * unc, 0, 1) * (0.5 + 0.5 * feas) * (0.85 + 0.3 * dm) * (view.hardExclude?.includes(p.id) ? 0.35 : 1)
    return { path: p, score, parts: { fi, fs, fm, fe, fr, feas, unc, dm } }
  })
  return out.sort((a, b) => b.score - a.score || (a.path.id < b.path.id ? -1 : 1))
}

export const rank = (st: State, content: Pick<Content, 'paths' | 'tiles'>, policy: Policy): Scored[] =>
  scorePaths(st, st.ctx, policy, content)

// how fragile is the answer? re-draw what we are unsure about and see if the top 3 survives
export const NOISE = 1.0 // scale on sqrt(var); tune with pilot data
export function bootstrap(st: State, content: Pick<Content, 'paths' | 'tiles'>, policy: Policy, B: number) {
  const rnd = mulberry32(hash(st.history.map((h) => h.id + ':' + h.value).join('|') + '#' + B))
  const base = rank(st, content, policy).map((s) => s.path.id)
  const top3 = base.slice(0, 3)
  let overlap = 0
  const hits: Record<string, number> = {}
  for (let b = 0; b < B; b++) {
    const mu = { ...st.mu }
    for (const d of DIMS) mu[d] = clamp(st.mu[d] + NOISE * Math.sqrt(st.vr[d]) * gauss(rnd), -1, 1)
    const r = scorePaths({ mu, vr: st.vr, practiced: st.practiced, reality: st.reality, outcomes: st.outcomes, weightCap: st.weightCap, hardExclude: st.hardExclude }, st.ctx, policy, content).map((s) => s.path.id)
    overlap += r.slice(0, 3).filter((id) => top3.includes(id)).length / 3
    for (const id of r.slice(0, 5)) hits[id] = (hits[id] ?? 0) + 1
  }
  const stability: Record<string, number> = {}
  for (const id of base) stability[id] = (hits[id] ?? 0) / B
  return { top3Overlap: overlap / B, stability }
}
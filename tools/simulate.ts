import { CONTENT } from '@cooker/content'
import {
  canStoreContact, finalizeState, applyJoyMap, initState, policyFor, quickMatch, runStep, stagePolicy, submit, muEff,
  type Freq, type Output, type Policy, type State,
} from '@cooker/engine'
import { DIMS, type AgeBand, type Answer, type Context, type Dim, type Item, type Response, type Situation } from '@cooker/shared'

type Traits = Partial<Record<Dim, number>>
interface Persona {
  id: string
  note: string
  ctx: Context
  joy: { picks: { tile: string; freq: Freq; output: Output }[]; helped: string[] }
  answer: (item: Item, i: number) => { value: Response; ms: number }
}

const aff = (loads: Traits, t: Traits): number => {
  let n = 0, d = 0
  for (const [k, w] of Object.entries(loads) as [Dim, number][]) { n += w * (t[k] ?? 0); d += Math.abs(w) }
  return d ? n / d : 0
}
// honest = answers by their true traits. No typing, no luck: same traits -> same answers.
const honest = (t: Traits, noDeal: string[] = [], ms = 1500) => (item: Item, i: number): { value: Response; ms: number } => {
  const m = ms + ((i * 137) % 700)
  if (item.kind === 'TRAP') return { value: item.expect as Answer, ms: m }
  if (item.kind === 'PICK2') return { value: aff(item.a!.loads, t) >= aff(item.b!.loads, t) ? 'A' : 'B', ms: m }
  if (item.group === 'DEALBREAKER') return { value: noDeal.includes(item.id) ? 'NO' : 'YES', ms: m }
  const a = aff(item.loads, t)
  return { value: a >= 0.4 ? 'YES' : a >= 0.1 ? 'SOMETIMES' : a <= -0.1 ? 'NO' : 'SKIP', ms: m }
}

const city = { money: 1, data: 3, education: 2, tools: 2, location: 3, time: 3 }
const rural = { money: 0, data: 0, education: 1, tools: 0, location: 0, time: 3 }
const ctx = (ageBand: AgeBand, situation: Situation, capital = city): Context => ({ ageBand, situation, capital })

const T1: Traits = { A: 0.9, I: 0.5, C: 0.2, R: -0.2, S: -0.2, E: -0.5, social_energy: -0.8, independence: 0.6, physical: -0.6, visibility: -0.3, pace: -0.3, outdoors: -0.3, structure: 0.3, risk: -0.2, mastery: 0.7, autonomy: 0.6 }
const T2: Traits = { E: 0.9, S: 0.4, A: 0.2, I: -0.2, C: -0.4, social_energy: 0.9, risk: 0.8, outdoors: 0.6, visibility: 0.6, pace: 0.6, physical: 0.4, structure: -0.3, independence: 0.5, status: 0.6 }
const T3: Traits = { R: 0.9, I: 0.1, E: -0.1, A: -0.1, C: -0.2, physical: 0.8, outdoors: 0.8, social_energy: -0.2, security: 0.5, pace: 0.1, structure: 0.2 }

const PERSONAS: Persona[] = [
  { id: 'P1', note: 'quiet, draws, edits on phone, sits hours alone', ctx: ctx('18-24', 'FINISHED_NO_WORK'),
    joy: { picks: [{ tile: 'drawing', freq: 'DAILY', output: 'MADE' }, { tile: 'photo', freq: 'WEEKLY', output: 'ONLY_ME' }, { tile: 'games', freq: 'WEEKLY', output: 'ONLY_ME' }], helped: [] },
    answer: honest(T1, ['d001', 'd003', 'd004']) },
  { id: 'P2', note: 'talks a lot, likes convincing, outdoors, risk high', ctx: ctx('25-39', 'WORKING'),
    joy: { picks: [{ tile: 'chatting', freq: 'DAILY', output: 'FOR_OTHERS' }, { tile: 'selling', freq: 'WEEKLY', output: 'FOR_OTHERS' }, { tile: 'football', freq: 'WEEKLY', output: 'ONLY_ME' }], helped: ['events'] },
    answer: honest(T2, ['d006']) },
  { id: 'P3', note: 'hands-on, rural, no money, no data', ctx: ctx('18-24', 'FARMING', rural),
    joy: { picks: [{ tile: 'farming', freq: 'DAILY', output: 'FOR_OTHERS' }, { tile: 'animals', freq: 'DAILY', output: 'MADE' }, { tile: 'building', freq: 'WEEKLY', output: 'ONLY_ME' }], helped: [] },
    answer: honest(T3, ['d003', 'd006']) },
  { id: 'P5', note: 'answers YES to everything', ctx: ctx('18-24', 'OTHER'), joy: { picks: [], helped: [] },
    answer: (item, i) => ({ value: item.kind === 'PICK2' ? 'A' : 'YES', ms: 1200 + ((i * 91) % 500) }) },
  { id: 'P6', note: 'age under 18', ctx: ctx('UNDER18', 'SCHOOL'),
    joy: { picks: [{ tile: 'drawing', freq: 'DAILY', output: 'MADE' }], helped: [] }, answer: honest(T1, ['d001']) },
  { id: 'P7', note: 'every card answered in 250 ms', ctx: ctx('18-24', 'OTHER'), joy: { picks: [], helped: [] },
    answer: (item, i) => ({ value: item.kind === 'PICK2' ? (i % 2 ? 'A' : 'B') : (['YES', 'NO', 'SOMETIMES'] as Answer[])[i % 3], ms: 250 }) },
]

function run(p: Persona) {
  const policy: Policy = policyFor(p.ctx)
  const st: State = initState(p.ctx)
  applyJoyMap(st, CONTENT, p.joy.picks, p.joy.helped)
  for (let i = 0; i < 100; i++) {
    const item = runStep(st, CONTENT, policy)
    if (!item) break
    const a = p.answer(item, i)
    submit(st, CONTENT, item, a.value, a.ms)
  }
  finalizeState(st, CONTENT)
  return { st, policy, m: quickMatch(st, CONTENT, policy) }
}

let fails = 0
const check = (ok: boolean, label: string) => { if (!ok) fails++; console.log(`   ${ok ? 'PASS' : 'FAIL'}  ${label}`) }
const names = (r: ReturnType<typeof run>, k = 5) => r.m.ranked.slice(0, k).map((s) => `${s.path.id} ${s.score.toFixed(2)}/${r.m.conf[s.path.id][0]}`).join(' | ')

const R: Record<string, ReturnType<typeof run>> = {}
for (const p of PERSONAS) {
  const r = run(p); R[p.id] = r
  console.log(`\n${p.id}  ${p.note}\n   cards asked: ${r.st.asked.length} | flags: ${r.st.flags.join(',') || '-'} | cap: ${r.st.cap} | skipped: ${Object.values(r.st.skips).reduce((a, b) => a + (b ?? 0), 0)}\n   top5: ${names(r)}`)
}
const top3 = (id: string) => R[id].m.ranked.slice(0, 3).map((s) => s.path.id)
const first = (id: string) => R[id].m.ranked[0].path.id
const none = (id: string) => !['YES_SAYER', 'NO_SAYER', 'CARELESS'].some((f) => R[id].st.flags.includes(f as never))

console.log('\n=== C2 sanity tests ===')
console.log('P1'); check(top3('P1').some((x) => ['media', 'webapp', 'bookkeeping'].includes(x)), `top3 has media|webapp|bookkeeping -> ${top3('P1')}`); check(!['sales', 'tourism'].includes(first('P1')), `#1 is not sales/tourism -> ${first('P1')}`)
console.log('P2'); check(top3('P2').some((x) => ['sales', 'tourism'].includes(x)), `top3 has sales|tourism -> ${top3('P2')}`); check(first('P2') !== 'bookkeeping', `#1 is not bookkeeping -> ${first('P2')}`)
console.log('P3'); check(top3('P3').some((x) => ['farming', 'construction', 'repair'].includes(x)), `top3 has farming|construction|repair -> ${top3('P3')}`)
console.log('P4  (borrowed dream / taste test) -> Stage 5: needs the reality-check stage')
console.log('P5'); check(R.P5.st.flags.includes('YES_SAYER'), 'YES_SAYER flag'); check(R.P5.st.cap !== 'HIGH', `confidence capped -> ${R.P5.st.cap}`)
const ext = Math.max(...DIMS.map((d) => Math.abs(muEff(R.P5.st.mu, R.P5.st.vr, d))))
check(ext <= 0.6, `result not extreme (max |mu_eff| = ${ext.toFixed(2)})`)
console.log('P6'); check(R.P6.policy.displayK === 5 && R.P6.policy.stepRules.includes('FREE_ONLY') && R.P6.policy.stepRules.includes('SCHOOL_COMPATIBLE'), 'shows 5 "things to try", steps free + school-compatible')
check(!canStoreContact('UNDER18', { contact: true, guardian: false }) && !canStoreContact('UNDER18', { contact: true, guardian: null }) && canStoreContact('UNDER18', { contact: true, guardian: true }) && canStoreContact('18-24', { contact: true }), 'contact stored only with guardian when under 18')
console.log('P7'); check(R.P7.st.cap === 'LOW' && R.P7.st.flags.includes('FATIGUE'), `confidence LOW + redo invitation -> cap ${R.P7.st.cap}, flags ${R.P7.st.flags}`)
console.log('P8'); const again = run(PERSONAS[0])
check(JSON.stringify([R.P1.st.asked, R.P1.m.ranked.map((s) => [s.path.id, s.score])]) === JSON.stringify([again.st.asked, again.m.ranked.map((s) => [s.path.id, s.score])]), 'same answers twice -> identical questions and result')

console.log('\n=== invariants ===')
const ages: AgeBand[] = ['UNDER18', '18-24', '25-39', '40+']
const sits: Situation[] = ['SCHOOL', 'FINISHED_NO_WORK', 'WORKING', 'OWN_BUSINESS', 'FARMING', 'ABROAD_OR_RETURNED', 'OTHER']
check(ages.every((a) => sits.every((s) => Math.abs(Object.values(stagePolicy(a, s).W).reduce((x, y) => x + y, 0) - 1) < 1e-9)), 'sum of W = 1 for every age x situation')
check(Object.values(R).every((r) => r.m.ranked.every((s) => s.score >= 0 && s.score <= 1)), 'all scores in [0,1]')
check(Object.values(R).every((r) => new Set(r.st.asked).size === r.st.asked.length), 'no card asked twice')
check(Object.values(R).every((r) => r.st.asked.length >= 14 && r.st.asked.length <= 30), `cards asked between 14 and 30 -> ${Object.entries(R).map(([k, r]) => k + ':' + r.st.asked.length).join(' ')}`)
check(['P1', 'P2', 'P3'].every(none), 'honest personas get no YES_SAYER / NO_SAYER / CARELESS flag')
check(['P1', 'P2', 'P3'].every((id) => R[id].st.asked.slice(0, 3).every((c) => CONTENT.items.find((i) => i.id === c)?.warm)), 'first 3 cards are warm-up cards')
check(Object.values(R).every((r) => { const k = r.st.history.findIndex((h) => h.id.startsWith('t')); return k === -1 || k >= 6 }), 'attention check never in the first 6 cards')

console.log(fails ? `\n${fails} CHECK(S) FAILED` : '\nALL CHECKS PASSED')
process.exit(fails ? 1 : 0)
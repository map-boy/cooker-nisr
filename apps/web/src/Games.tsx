import { useEffect, useRef, useState } from 'react'

export interface Skills { focus: number; reasoning: number; memory: number }
type Tx = (k: string) => string
// seeded RNG (rule R10): same seed -> same game sequence; test with ?seed=123
let _s = (Number(new URLSearchParams(location.search).get('seed')) || 20261021) >>> 0
const rnd = (): number => { _s = (_s + 0x6D2B79F5) >>> 0; let t = _s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296 }
const shuffle = <T,>(a: T[]): T[] => { const b = [...a]; for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [b[i], b[j]] = [b[j], b[i]] } return b }

function Focus({ tx, onDone }: { tx: Tx; onDone: (v: number) => void }) {
  const [i, setI] = useState(-1)
  const plan = useRef(shuffle(Array.from({ length: 20 }, (_, k) => (k % 10 < 7 ? 'go' : 'stop'))))
  const tapped = useRef<boolean[]>([])
  useEffect(() => {
    if (i < 0) return
    if (i >= 20) {
      const goN = plan.current.filter((p) => p === 'go').length
      const stopN = 20 - goN
      let hits = 0, ok = 0
      plan.current.forEach((p, k) => { if (p === 'go' && tapped.current[k]) hits++; if (p === 'stop' && !tapped.current[k]) ok++ })
      onDone((hits / goN + ok / stopN) / 2)
      return
    }
    const id = setTimeout(() => setI(i + 1), 900)
    return () => clearTimeout(id)
  }, [i])
  if (i < 0) return <button className="btn primary" onClick={() => setI(0)}><span className="name">{tx('games.go')}</span></button>
  if (i >= 20) return null
  const go = plan.current[i] === 'go'
  return (
    <button className="btn" style={{ minHeight: 160 }} onClick={() => { tapped.current[i] = true; try { navigator.vibrate?.(30) } catch { /* ignore */ } }}>
      <span style={{ width: 90, height: 90, borderRadius: '50%', background: go ? '#27a39c' : '#c8452b', display: 'inline-block' }} />
    </button>
  )
}

interface Q { seq: number[]; opts: number[]; ans: number }
function makeQs(): Q[] {
  return Array.from({ length: 5 }, (_, k) => {
    const dbl = k % 2 === 1
    const a = 2 + k, d = 2 + k
    const seq = dbl ? [a, a * 2, a * 4, a * 8] : [a, a + d, a + 2 * d, a + 3 * d]
    const ans = dbl ? a * 16 : a + 4 * d
    const wrong = dbl ? [ans - a * 2, ans + a * 2, ans - 2] : [ans - d, ans + d, ans + 1]
    return { seq, ans, opts: shuffle([ans, ...wrong]) }
  })
}
function Reasoning({ tx, onDone }: { tx: Tx; onDone: (v: number) => void }) {
  const qs = useRef(makeQs())
  const [n, setN] = useState(0)
  const [ok, setOk] = useState(0)
  const pick = (v: number) => {
    const nok = ok + (v === qs.current[n].ans ? 1 : 0)
    setOk(nok)
    if (n === 4) onDone(nok / 5); else setN(n + 1)
  }
  const q = qs.current[n]
  return (
    <div className="stack">
      <p className="hint">{n + 1}/5</p>
      <p className="q" style={{ textAlign: 'center' }}>{q.seq.join(', ')}, ?</p>
      <div className="opts">
        {q.opts.map((o) => <button key={o} className="btn opt" onClick={() => pick(o)}><span className="name">{o}</span></button>)}
      </div>
    </div>
  )
}

function Memory({ tx, onDone }: { tx: Tx; onDone: (v: number) => void }) {
  const [round, setRound] = useState(0)
  const [phase, setPhase] = useState<'idle' | 'show' | 'input'>('idle')
  const [seq, setSeq] = useState<number[]>([])
  const [lit, setLit] = useState(-1)
  const [pos, setPos] = useState(0)
  const [ok, setOk] = useState(0)
  const timer = useRef<ReturnType<typeof setInterval> | null>(null)
  useEffect(() => () => { if (timer.current) clearInterval(timer.current) }, [])
  function begin() {
    const s = Array.from({ length: [3, 4, 5][round] }, () => Math.floor(rnd() * 9))
    const steps = s.flatMap((c) => [c, -1])
    setSeq(s); setPos(0); setPhase('show')
    let k = 0
    const id = setInterval(() => {
      timer.current = id
      if (k < steps.length) setLit(steps[k++])
      else { clearInterval(id); setLit(-1); setPhase('input') }
    }, 450)
  }
  function next(good: boolean) {
    const nok = ok + (good ? 1 : 0)
    setOk(nok)
    if (round === 2) onDone(nok / 3)
    else { setRound(round + 1); setPhase('idle') }
  }
  function tap(c: number) {
    if (phase !== 'input') return
    if (c !== seq[pos]) next(false)
    else if (pos + 1 === seq.length) next(true)
    else setPos(pos + 1)
  }
  return (
    <div className="stack">
      <p className="hint">{round + 1}/3</p>
      <div className="tiles">
        {Array.from({ length: 9 }, (_, c) => <button key={c} className={'tile' + (lit === c ? ' on' : '')} onClick={() => tap(c)} />)}
      </div>
      {phase === 'idle' && <button className="btn primary" onClick={begin}><span className="name">{tx('games.go')}</span></button>}
    </div>
  )
}

export default function Games({ tx, onDone }: { tx: Tx; onDone: (s: Skills | null) => void }) {
  const [stage, setStage] = useState(0)
  const sc = useRef<Partial<Skills>>({})
  const done = (k: keyof Skills) => (v: number) => {
    sc.current[k] = v
    if (stage === 2) onDone(sc.current as Skills); else setStage(stage + 1)
  }
  const keys = ['focus', 'reasoning', 'memory'] as const
  return (
    <div className="stack">
      <div className="qhead"><span className="big">{'\u{1F9E0}'}</span><p className="q">{tx('games.' + keys[stage])}</p><p className="hint">{tx('games.title')} {stage + 1}/3</p></div>
      {stage === 0 && <Focus key="f" tx={tx} onDone={done('focus')} />}
      {stage === 1 && <Reasoning key="r" tx={tx} onDone={done('reasoning')} />}
      {stage === 2 && <Memory key="m" tx={tx} onDone={done('memory')} />}
      <button className="link" onClick={() => onDone(null)}>{tx('games.skip')}</button>
    </div>
  )
}
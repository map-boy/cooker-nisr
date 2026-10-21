import { useEffect, useRef, useState } from 'react'
import { CONTENT, DEMAND } from '@cooker/content'
import { addEvidence, applyJoyMap, finalizeState, initState, MIN_CARDS, muEff, policyFor, quickMatch, runStep, submit, type Freq, type Output, type Policy, type State } from '@cooker/engine'
import type { Context, Item, Response } from '@cooker/shared'
import { LANGS, type Lang, type LangCode } from './langs'
import { loadDict, type Dict } from './i18n'
import { prewarm, type ApiStatus } from './api'
import { QS, buildContext } from './ctx'
import Games, { type Skills } from './Games'
import Dashboard, { saveSupply } from './Dashboard'
import { hintsFor, LEVELS, loadJourney, saveJourney, streak, todayStr, type Journey } from './journey'

const KEY = 'cooker.lang'

type Screen = 'lang' | 'start' | 'consent' | 'ctx' | 'joy' | 'detail' | 'helped' | 'games' | 'dash' | 'cards' | 'result' | 'journey'
type Joy = { tile: string; freq: Freq; output: Output }
type Match = ReturnType<typeof quickMatch>

function lastLang(): LangCode | null {
  try {
    const v = localStorage.getItem(KEY)
    return LANGS.some((l) => l.code === v) ? (v as LangCode) : null
  } catch {
    return null
  }
}

// [x, baseY, width, height, wall, roof]
const HOUSES: [number, number, number, number, string, string][] = [
  [30, 160, 34, 26, '#FFE7C2', '#C8452B'],
  [75, 152, 28, 30, '#F4B183', '#1F8A84'],
  [118, 158, 36, 24, '#FFD9A8', '#B8431F'],
  [200, 150, 30, 28, '#FFE7C2', '#1F8A84'],
  [250, 156, 38, 26, '#F7C59F', '#C8452B'],
  [310, 148, 30, 30, '#FFE7C2', '#B8431F'],
  [350, 158, 32, 24, '#F4B183', '#1F8A84'],
]

function Scene() {
  return (
    <svg className="scene" viewBox="0 0 400 230" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#6EC1EE" />
          <stop offset=".65" stopColor="#FBD9B4" />
          <stop offset="1" stopColor="#FFE9CC" />
        </linearGradient>
      </defs>
      <rect width="400" height="230" fill="url(#sky)" />
      <circle cx="324" cy="64" r="26" fill="#FFD27A" opacity=".9" />
      <ellipse cx="80" cy="50" rx="34" ry="10" fill="#fff" opacity=".85" />
      <ellipse cx="104" cy="42" rx="22" ry="9" fill="#fff" opacity=".85" />
      <path d="M0 140 Q60 92 130 124 T260 108 T400 120 V230 H0Z" fill="#6DB38E" />
      <path d="M0 168 Q80 124 170 152 T320 142 T400 152 V230 H0Z" fill="#E58A4A" />
      {HOUSES.map(([x, y, w, h, wall, roof], i) => (
        <g key={i}>
          <rect x={x} y={y - h} width={w} height={h} rx="2" fill={wall} />
          <polygon points={`${x - 3},${y - h} ${x + w / 2},${y - h - 14} ${x + w + 3},${y - h}`} fill={roof} />
          <rect x={x + w / 2 - 3} y={y - h + 8} width="6" height="9" rx="1" fill="#3B2418" opacity=".55" />
        </g>
      ))}
      <path d="M0 200 Q100 176 200 194 T400 188 V230 H0Z" fill="#1F8A84" />
    </svg>
  )
}

const Arrow = () => <span className="go">{'\u2192'}</span>

export default function App() {
  const [lang, setLang] = useState<Lang | null>(null)
  const [t, setT] = useState<Dict>({})
  const [api, setApi] = useState<ApiStatus>('idle')
  const [screen, setScreen] = useState<Screen>('lang')
  const [ctxStep, setCtxStep] = useState(0)
  const [ctxAns, setCtxAns] = useState<Record<string, string>>({})
  const [ctx, setCtx] = useState<Context | null>(null)
  const [picks, setPicks] = useState<string[]>([])
  const [details, setDetails] = useState<Joy[]>([])
  const [di, setDi] = useState(0)
  const [pendingFreq, setPendingFreq] = useState<Freq | null>(null)
  const [helped, setHelped] = useState<string[]>([])
  const [skills, setSkills] = useState<Skills | null>(null)
  const [item, setItem] = useState<Item | null>(null)
  const [res, setRes] = useState<Match | null>(null)
  const [journey, setJourney] = useState<Journey | null>(() => loadJourney())
  const [jq, setJq] = useState<'how' | 'why' | null>(null)
  const eng = useRef<{ st: State; policy: Policy; best: number } | null>(null)
  const shownAt = useRef(Date.now())
  const last = lastLang()

  useEffect(() => { shownAt.current = Date.now() }, [item])

  const tx = (k: string) => t[k] ?? k

  async function pick(l: Lang) {
    try { localStorage.setItem(KEY, l.code) } catch { /* storage can be blocked; ignore */ }
    document.documentElement.lang = l.code
    document.documentElement.dir = l.dir
    void prewarm(setApi)
    setT(await loadDict(l.code))
    setLang(l)
    setScreen('start')
  }

  function change() {
    setLang(null)
    setScreen('lang')
    document.documentElement.lang = 'en'
    document.documentElement.dir = 'ltr'
  }

  function restart() {
    setCtxStep(0); setCtxAns({}); setCtx(null); setPicks([]); setDetails([]); setDi(0)
    setPendingFreq(null); setHelped([]); setItem(null); setRes(null); eng.current = null
    setScreen('start')
  }

  function answerCtx(qid: string, val: string) {
    const next = { ...ctxAns, [qid]: val }
    setCtxAns(next)
    if (ctxStep + 1 < QS.length) setCtxStep(ctxStep + 1)
    else { setCtx(buildContext(next)); setScreen('joy') }
  }

  const toggle = (list: string[], set: (v: string[]) => void, id: string, max: number) =>
    set(list.includes(id) ? list.filter((x) => x !== id) : list.length < max ? [...list, id] : list)

  function chooseOutput(o: Output) {
    const next = [...details, { tile: picks[di], freq: pendingFreq as Freq, output: o }]
    setDetails(next)
    setPendingFreq(null)
    if (di + 1 < picks.length) setDi(di + 1)
    else setScreen('helped')
  }

  function startCards(sk: Skills | null = null) {
    const c = ctx as Context
    const policy = policyFor(c)
    const st = initState(c)
    applyJoyMap(st, CONTENT, details, helped)
    if (sk) for (const [d, x] of [['I', sk.reasoning], ['C', sk.memory], ['structure', sk.focus]] as const) addEvidence(st, { d, signal: Math.max(-1, Math.min(1, (x - 0.5) * 2)), weight: 0.4, source: 'PRACTICE' })
    eng.current = { st, policy, best: 0 }
    setItem(runStep(st, CONTENT, policy))
    setScreen('cards')
  }

  function answer(value: Response) {
    const e = eng.current
    if (!e || !item) return
    submit(e.st, CONTENT, item, value, Date.now() - shownAt.current)
    const nx = runStep(e.st, CONTENT, e.policy)
    if (nx) { setItem(nx); return }
    finalizeState(e.st, CONTENT)
    const m = quickMatch(e.st, CONTENT, e.policy)
    if (e.st.ctx.ageBand !== 'UNDER18') saveSupply(m.top[0]?.path.id)
    setRes(m)
    setScreen('result')
  }

  // ---------- journey ----------

  function startJourney(pathId: string) {
    const e = eng.current
    const social = e ? muEff(e.st.mu, e.st.vr, 'social_energy') : 0
    const j: Journey = { pathId, startedAt: new Date().toISOString(), level: 0, done: {}, days: [], blocked: null, social, minor: e?.st.ctx.ageBand === 'UNDER18', hints: e ? hintsFor(e.st.ctx.capital, e.policy.stepRules) : [] }
    saveJourney(j)
    setJourney(j)
    setJq(null)
    setScreen('journey')
  }

  function finish(a: 'LIKED' | 'OK' | 'DISLIKED') {
    if (!journey) return
    setJq(null)
    if (a === 'DISLIKED') {
      saveJourney(null)
      setJourney(null)
      setScreen(res ? 'result' : 'start')
      return
    }
    const day = todayStr()
    const nj: Journey = {
      ...journey,
      done: { ...journey.done, [journey.level]: a },
      level: journey.level + 1,
      days: journey.days.includes(day) ? journey.days : [...journey.days, day],
      blocked: null,
    }
    saveJourney(nj)
    setJourney(nj)
  }

  function notYet(b: string) {
    if (!journey) return
    const nj: Journey = { ...journey, blocked: b }
    saveJourney(nj)
    setJourney(nj)
    setJq(null)
  }

  const TileGrid = ({ list, setList, max }: { list: string[]; setList: (v: string[]) => void; max: number }) => (
    <div className="tiles">
      {CONTENT.tiles.map((tl) => (
        <button key={tl.id} className={'tile' + (list.includes(tl.id) ? ' on' : '')} onClick={() => toggle(list, setList, tl.id, max)}>
          <span className="ic">{tl.icon}</span>
          <span className="lb">{tx(tl.textKey)}</span>
        </button>
      ))}
    </div>
  )

  const dir = lang?.dir
  const lc = lang?.code
  const q = QS[ctxStep]
  const curTile = CONTENT.tiles.find((x) => x.id === picks[di])
  const e = eng.current
  if (e) { const raw = Math.min(0.95, e.st.asked.length / MIN_CARDS); if (raw > e.best) e.best = raw }
  const pct = Math.round((e?.best ?? 0) * 100)

  const jp = journey ? CONTENT.paths.find((p) => p.id === journey.pathId) : undefined
  const lv = journey ? LEVELS[journey.level] : undefined
  const tip = journey && lv && lv.social >= 1 ? (journey.social < -0.3 ? tx('j.quiet') : journey.social > 0.3 ? tx('j.talker') : '') : ''

  return (
    <main className="screen">
      <div className="device">
        <header className="hero">
          <Scene />
          <h1 className="brand">
            <span className="pot">{'\u{1F372}'}</span>Cooker
          </h1>
        </header>

        <section className="slab">
          <div className="sheet" lang={lc} dir={dir}>
            {screen === 'lang' && (
              <div className="grid" lang="en" dir="ltr">
                {LANGS.map((l) => (
                  <button key={l.code} className={'btn lang' + (l.code === last ? ' last' : '')} lang={l.code} dir={l.dir} onClick={() => void pick(l)}>
                    <span className="name">{l.native}</span>
                    <span className="go">{'\u2192'}</span>
                  </button>
                ))}
              </div>
            )}

            {screen === 'start' && lang && (
              <div className="stack">
                <button className="chip" onClick={change} aria-label="change language">{'\u21BB'} {lang.native}</button>
                {journey && jp && (
                  <button className="btn alt" onClick={() => { setJq(null); setScreen('journey') }}>
                    <span className="name">{tx('j.continue')}: {tx(jp.nameKey)}</span><Arrow />
                  </button>
                )}
                <p className="about">{tx('about')}</p>
                <button className="btn alt" onClick={() => setScreen('dash')}><span className="name">{tx('dash.open')}</span></button>
                <button className="btn primary" onClick={() => setScreen('consent')}>
                  <span className="name">{tx('start')}</span><Arrow />
                </button>
              </div>
            )}

            {screen === 'consent' && (
              <div className="stack">
                <div className="qhead"><span className="big">{'\u{1F512}'}</span><p className="q">{tx('consent.title')}</p></div>
                <div className="lines">
                  <div className="line"><span className="ic">{'\u{1F446}'}</span>{tx('consent.1')}</div>
                  <div className="line"><span className="ic">{'\u{1F373}'}</span>{tx('consent.2')}</div>
                  <div className="line"><span className="ic">{'\u{1F6D1}'}</span>{tx('consent.3')}</div>
                </div>
                <button className="btn primary" onClick={() => setScreen('ctx')}>
                  <span className="name">{tx('consent.ok')}</span><Arrow />
                </button>
              </div>
            )}

            {screen === 'ctx' && (
              <div className="stack">
                <div className="potrow"><div className="bar"><i style={{ width: Math.round(((ctxStep + 1) / QS.length) * 100) + '%' }} /></div></div>
                <div className="qhead"><span className="big">{q.icon}</span><p className="q">{tx('ctx.' + q.id)}</p></div>
                <div className="opts">
                  {q.opts.map((o) => (
                    <button key={o.id} className="btn opt" onClick={() => answerCtx(q.id, o.id)}>
                      <span className="ic">{o.icon}</span>
                      <span className="name">{tx('ctx.' + q.id + '.' + o.id)}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {screen === 'joy' && (
              <div className="stack">
                <div className="qhead"><span className="big">{'\u{1F4AB}'}</span><p className="q">{tx('joy.title')}</p><p className="hint">{tx('joy.hint')} ({picks.length}/5)</p></div>
                <TileGrid list={picks} setList={setPicks} max={5} />
                <button className="btn primary" onClick={() => { setDi(0); setScreen(picks.length ? 'detail' : 'helped') }}>
                  <span className="name">{tx('joy.next')}</span><Arrow />
                </button>
              </div>
            )}

            {screen === 'detail' && curTile && (
              <div className="stack">
                <div className="qhead">
                  <span className="big">{curTile.icon}</span>
                  <p className="q">{tx(curTile.textKey)}</p>
                  <p className="hint">{tx(pendingFreq ? 'joy.out' : 'joy.freq')}</p>
                </div>
                <div className="opts">
                  {!pendingFreq
                    ? (['DAILY', 'WEEKLY', 'SOMETIMES'] as Freq[]).map((f) => (
                        <button key={f} className="btn opt" onClick={() => setPendingFreq(f)}><span className="name">{tx('joy.' + f)}</span></button>
                      ))
                    : (['FOR_OTHERS', 'MADE', 'ONLY_ME'] as Output[]).map((o) => (
                        <button key={o} className="btn opt" onClick={() => chooseOutput(o)}><span className="name">{tx('joy.' + o)}</span></button>
                      ))}
                </div>
              </div>
            )}

            {screen === 'helped' && (
              <div className="stack">
                <div className="qhead"><span className="big">{'\u{1F91D}'}</span><p className="q">{tx('helped.title')}</p><p className="hint">{tx('helped.hint')} ({helped.length}/3)</p></div>
                <TileGrid list={helped} setList={setHelped} max={3} />
                <button className="btn primary" onClick={() => setScreen('games')}>
                  <span className="name">{tx('joy.next')}</span><Arrow />
                </button>
              </div>
            )}

            {screen === 'dash' && <Dashboard tx={tx} onBack={() => setScreen(res ? 'result' : 'start')} />}
            {screen === 'games' && <Games tx={tx} onDone={(s) => { setSkills(s); startCards(s) }} />}

            {screen === 'cards' && item && (
              <div className="stack">
                <div className="potrow">
                  <span className="potico">{'\u{1F372}'}</span>
                  <div className="bar"><i style={{ width: pct + '%' }} /></div>
                </div>
                {pct >= 50 && <p className="hint">{tx('pot.half')}</p>}

                {item.kind === 'PICK2' && item.a && item.b ? (
                  <>
                    <div className="qhead"><p className="q">{tx(item.textKey)}</p></div>
                    <div className="pair">
                      <button className="btn" onClick={() => answer('A')}><span className="ic">{item.a.icon}</span><span className="name">{tx(item.a.textKey)}</span></button>
                      <button className="btn" onClick={() => answer('B')}><span className="ic">{item.b.icon}</span><span className="name">{tx(item.b.textKey)}</span></button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="face"><span className="big">{item.icon}</span><p className="q">{tx(item.textKey)}</p></div>
                    <div className="answers">
                      <button className="btn ans yes" onClick={() => answer('YES')}><span className="mark">{'\u2714'}</span><span className="name">{tx('card.yes')}</span></button>
                      <button className="btn ans" onClick={() => answer('SOMETIMES')}><span className="mark">~</span><span className="name">{tx('card.some')}</span></button>
                      <button className="btn ans no" onClick={() => answer('NO')}><span className="mark">{'\u2716'}</span><span className="name">{tx('card.no')}</span></button>
                    </div>
                  </>
                )}
                <button className="link" onClick={() => answer('SKIP')}>{tx('card.skip')}</button>
              </div>
            )}

            {screen === 'result' && res && (
              <div className="stack">
                <div className="qhead"><span className="big">{'\u{1F958}'}</span><p className="q">{tx('result.title')}</p><p className="hint">{tx('result.hint')}</p><p className="hint">{tx('result.tap')}</p><p className="hint">{tx('demand.src')}</p></div>
                {res.cap === 'LOW' && <p className="hint">{tx('result.rough')}</p>}
                {skills && <p className="hint">{tx('games.result')} {Math.round(skills.focus * 100)}% | {Math.round(skills.reasoning * 100)}% | {Math.round(skills.memory * 100)}%</p>}
                {res.top.map((s, i) => (
                  <button className="res" key={s.path.id} onClick={() => startJourney(s.path.id)}>
                    <span className="rank">{i + 1}</span>
                    <div className="rt">
                      <b>{tx(s.path.nameKey)}</b>
                      <span className={'conf ' + res.conf[s.path.id]}>{tx('conf.' + res.conf[s.path.id])}</span>
                      <div className="meter"><i style={{ width: Math.round(s.score * 100) + '%' }} /></div>
                      {DEMAND[s.path.id] && <span className="hint">{tx('demand.line').replace('{share}', String(DEMAND[s.path.id].share)).replace('{change}', (DEMAND[s.path.id].change > 0 ? '+' : '') + DEMAND[s.path.id].change)}</span>}
                    </div>
                  </button>
                ))}
                <button className="btn primary" onClick={restart}>
                  <span className="name">{tx('result.again')}</span><Arrow />
                </button>
              </div>
            )}

            {screen === 'journey' && journey && jp && (
              <div className="stack">
                <div className="qhead">
                  <span className="big">{'\u{1F5FA}\uFE0F'}</span>
                  <p className="q">{tx(jp.nameKey)}</p>
                  <p className="hint">{'\u{1F525}'} {tx('j.streak')}: {streak(journey.days)}</p>
                </div>
                <div className="road">
                  {LEVELS.map((_, i) => (
                    <div key={i} className={'stn' + (i < journey.level ? ' done' : i === journey.level ? ' now' : '')}>
                      {i < journey.level ? '\u2714' : i + 1}
                    </div>
                  ))}
                  <div className="stn flag">{'\u{1F3C1}'}</div>
                </div>
                <div className="bar"><i style={{ width: Math.round((journey.level / LEVELS.length) * 100) + '%' }} /></div>

                {lv ? (
                  <>
                    <div className="stepcard">
                      <span className="lvl">{tx('j.step')} {journey.level + 1} {tx('j.of')} {LEVELS.length} | {tx('lvl.' + journey.level)}</span>
                      <p className="stext">{tx('step.' + jp.id + '.' + journey.level)}</p>
                      <span className="mins">{'\u23F1\uFE0F'} {lv.minutes} {tx('j.min')}</span>
                      {tip && <p className="hint">{tip}</p>}
                      {journey.blocked && <p className="fix">{tx('j.fix.' + journey.blocked)}</p>}
        {journey.minor && lv && lv.social >= 2 && <p className="fix">{tx('j.minor')}</p>}
        {(journey.hints ?? []).slice(0, 2).map((h) => <p className="fix" key={h}>{tx('j.h.' + h)}</p>)}
                    </div>

                    {jq === null && (
                      <div className="opts">
                        <button className="btn primary" onClick={() => setJq('how')}><span className="name">{tx('j.done')}</span><Arrow /></button>
                        <button className="btn alt" onClick={() => setJq('why')}><span className="name">{tx('j.notyet')}</span></button>
                      </div>
                    )}
                    {jq === 'how' && (
                      <div className="opts">
                        <p className="hint">{tx('j.how')}</p>
                        <button className="btn opt" onClick={() => finish('LIKED')}><span className="ic">{'\u{1F60D}'}</span><span className="name">{tx('j.liked')}</span></button>
                        <button className="btn opt" onClick={() => finish('OK')}><span className="ic">{'\u{1F642}'}</span><span className="name">{tx('j.ok')}</span></button>
                        <button className="btn opt" onClick={() => finish('DISLIKED')}><span className="ic">{'\u{1F645}'}</span><span className="name">{tx('j.disliked')}</span></button>
                      </div>
                    )}
                    {jq === 'why' && (
                      <div className="opts">
                        <p className="hint">{tx('j.why')}</p>
                        <div className="two">
                          {['NO_TIME', 'NO_DATA', 'FORGOT', 'AFRAID'].map((b) => (
                            <button key={b} className="btn" onClick={() => notYet(b)}><span className="name">{tx('j.b.' + b)}</span></button>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="stepcard">
                    <span className="big">{'\u{1F3C6}'}</span>
                    <p className="stext">{tx('j.finished')}</p>
                    <p className="hint">{tx('j.finished2')}</p>
                  </div>
                )}

                <></>
                <button className="link" onClick={() => setScreen(res ? 'result' : 'start')}>{tx('j.change')}</button>
              </div>
            )}
          </div>
        </section>
      </div>

      {import.meta.env.DEV && <div className={'dot ' + api}>api: {api}</div>}
    </main>
  )
}
import { CONTENT, DEMAND } from '@cooker/content'

const KEY = 'cooker.supply'
type Tx = (k: string) => string

export function saveSupply(pathId: string | undefined): void {
  if (!pathId) return
  try {
    const m = JSON.parse(localStorage.getItem(KEY) ?? '{}') as Record<string, number>
    m[pathId] = (m[pathId] ?? 0) + 1
    localStorage.setItem(KEY, JSON.stringify(m))
  } catch { /* storage can be blocked; ignore */ }
}

function loadSupply(): Record<string, number> {
  try { return JSON.parse(localStorage.getItem(KEY) ?? '{}') as Record<string, number> } catch { return {} }
}

export default function Dashboard({ tx, onBack }: { tx: Tx; onBack: () => void }) {
  const sup = loadSupply()
  const total = Object.values(sup).reduce((a, b) => a + b, 0)
  const rows = CONTENT.paths
    .map((p) => ({ id: p.id, name: tx(p.nameKey), demand: DEMAND[p.id]?.share ?? 0, change: DEMAND[p.id]?.change ?? 0, supply: total ? Math.round(((sup[p.id] ?? 0) / total) * 100) : 0 }))
    .sort((a, b) => b.demand - a.demand)
  const maxD = Math.max(...rows.map((r) => r.demand), 1)
  return (
    <div className="stack">
      <div className="qhead"><span className="big">{'\u{1F4CA}'}</span><p className="q">{tx('dash.title')}</p><p className="hint">{tx('dash.hint')}</p></div>
      <div className="lines">
        <div className="line">{tx('dash.neet')}</div>
        <div className="line">{tx('dash.unemp')}</div>
      </div>
      {rows.map((r) => (
        <div key={r.id} style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <b>{r.name}</b>
          <div className="meter" title="demand"><i style={{ width: Math.round((r.demand / maxD) * 100) + '%' }} /></div>
          <span className="hint">{tx('dash.demand')} {r.demand}% ({r.change > 0 ? '+' : ''}{r.change}%)</span>
          <div className="meter" title="supply"><i style={{ width: r.supply + '%', background: '#27a39c' }} /></div>
          <span className="hint">{tx('dash.supply')} {r.supply}%</span>
        </div>
      ))}
      <p className="hint">{tx('dash.n')} {total}</p>
      <p className="hint">{tx('demand.src')}</p>
      <button className="btn primary" onClick={onBack}><span className="name">{tx('dash.back')}</span></button>
    </div>
  )
}
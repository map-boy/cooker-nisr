import { readFileSync } from 'node:fs'
import { CONTENT } from '@cooker/content'
import { BARRIERS, DIMS, type Dim, type Item } from '@cooker/shared'

const en: Record<string, string> = JSON.parse(readFileSync(new URL('../packages/content/i18n/en.json', import.meta.url), 'utf8'))
const errors: string[] = []
const err = (m: string) => errors.push(m)
const { items, tiles, paths } = CONTENT

const dup = (ids: string[], what: string) => { const s = new Set<string>(); for (const id of ids) { if (s.has(id)) err(`duplicate ${what} id ${id}`); s.add(id) } }
dup(items.map((i) => i.id), 'item'); dup(tiles.map((t) => t.id), 'tile'); dup(paths.map((p) => p.id), 'path')

const pathIds = new Set(paths.map((p) => p.id))
const itemById = new Map(items.map((i) => [i.id, i]))
const keysOf = (i: Item) => (i.kind === 'PICK2' ? [i.a!.textKey, i.b!.textKey, i.textKey] : [i.textKey])
const words = (s: string) => s.trim().split(/\s+/).length

const checkKey = (k: string, what: string) => {
  if (!(k in en)) { err(`${what}: missing en text "${k}"`); return }
  if (words(en[k]) > 12) err(`${what}: "${k}" has ${words(en[k])} words (max 12)`)
}
const checkLoads = (l: Partial<Record<Dim, number>>, what: string) => {
  for (const [d, w] of Object.entries(l)) {
    if (!(DIMS as readonly string[]).includes(d)) err(`${what}: unknown dim ${d}`)
    if (typeof w !== 'number' || w < -1 || w > 1) err(`${what}: load ${d}=${w} out of [-1,1]`)
  }
}

for (const i of items) {
  keysOf(i).forEach((k) => checkKey(k, `item ${i.id}`))
  checkLoads(i.loads, `item ${i.id}`)
  if (i.kind === 'PICK2') { checkLoads(i.a!.loads, `item ${i.id}.a`); checkLoads(i.b!.loads, `item ${i.id}.b`) }
  if (i.kind === 'TRAP' && !i.expect) err(`trap ${i.id} has no expect`)
  if (i.group === 'DEALBREAKER') {
    if (!i.excludes?.length) err(`dealbreaker ${i.id} excludes nothing`)
    i.excludes?.forEach((p) => { if (!pathIds.has(p)) err(`dealbreaker ${i.id}: unknown path ${p}`) })
  }
  if (i.twinOf) {
    const t = itemById.get(i.twinOf)
    if (!t) err(`item ${i.id}: twinOf ${i.twinOf} not found`)
    else {
      const shared = (Object.keys(i.loads) as Dim[]).filter((d) => d in t.loads && Math.sign(i.loads[d]!) !== Math.sign(t.loads[d]!))
      if (!shared.length) err(`twins ${i.id}/${t.id} share no dimension with opposite sign`)
    }
  }
}
for (const t of tiles) {
  checkKey(t.textKey, `tile ${t.id}`); checkLoads(t.loads, `tile ${t.id}`)
  if (!paths.some((p) => t.tags.some((x) => p.tags.includes(x)))) err(`tile ${t.id}: tags match no path`)
}
for (const p of paths) {
  checkKey(p.nameKey, `path ${p.id}`)
  if (p.bridge && !pathIds.has(p.bridge)) err(`path ${p.id}: unknown bridge ${p.bridge}`)
  for (const b of BARRIERS) if (!(p.barrier[b] >= 0 && p.barrier[b] <= 3)) err(`path ${p.id}: barrier ${b} out of 0..3`)
  for (const [d, v] of Object.entries(p.interest)) if (v! < 0 || v! > 1) err(`path ${p.id}: interest ${d} out of 0..1`)
  for (const [d, [t, imp]] of Object.entries(p.style)) { if (t < -1 || t > 1 || imp < 0 || imp > 1) err(`path ${p.id}: style ${d} out of range`) }
  for (const [d, v] of Object.entries(p.motives)) if (v! < 0 || v! > 1) err(`path ${p.id}: motive ${d} out of 0..1`)
}

// coverage + balance
const covered = new Set<string>()
items.forEach((i) => { Object.keys(i.loads).forEach((d) => covered.add(d)); if (i.kind === 'PICK2') { Object.keys(i.a!.loads).concat(Object.keys(i.b!.loads)).forEach((d) => covered.add(d)) } })
DIMS.forEach((d) => { if (!covered.has(d)) err(`dimension ${d} is measured by no item`) })
for (const d of ['social_energy', 'structure', 'pace', 'physical', 'outdoors', 'risk', 'visibility', 'independence'] as Dim[]) {
  const cards = items.filter((i) => i.kind === 'CARD' && i.group === 'STYLE' && i.loads[d] !== undefined)
  if (!cards.some((i) => i.loads[d]! > 0) || !cards.some((i) => i.loads[d]! < 0)) err(`style ${d}: needs a positive and a reverse-keyed card`)
}
const themes = new Set(items.filter((i) => i.warm).map((i) => i.theme))
if (themes.size < 3) err('need at least 3 warm-up themes')

const count = (f: (i: Item) => boolean) => items.filter(f).length
console.log(`items: ${count((i) => i.kind === 'CARD' && i.group !== 'DEALBREAKER')} cards, ${count((i) => i.kind === 'PICK2')} pairs, ${count((i) => i.kind === 'TRAP')} traps, ${count((i) => i.group === 'DEALBREAKER')} dealbreakers | tiles: ${tiles.length} | paths: ${paths.length} | en keys: ${Object.keys(en).length}`)
if (errors.length) { console.log('LINT FAILED:\n - ' + errors.join('\n - ')); process.exit(1) }
console.log('LINT OK')
import type { Group, Item, Loads, Option } from '@cooker/shared'

// Icons use \u escapes so these files survive any terminal paste.
type Extra = Partial<Pick<Item, 'twinOf' | 'excludes' | 'fun' | 'heavy' | 'warm' | 'theme'>>
const card = (id: string, group: Group, loads: Loads, icon: string, o: Extra = {}): Item => ({
  id, kind: 'CARD', group, loads, icon, textKey: 'q.' + id, fun: 0.5, ...o,
})
const opt = (id: string, side: 'a' | 'b', icon: string, loads: Loads): Option => ({ textKey: 'q.' + id + '.' + side, icon, loads })
const pick2 = (id: string, a: [string, Loads], b: [string, Loads]): Item => ({
  id, kind: 'PICK2', group: 'ENJOY', loads: {}, icon: '\u2696\uFE0F', textKey: 'ui.pick', fun: 0.6,
  a: opt(id, 'a', a[0], a[1]), b: opt(id, 'b', b[0], b[1]),
})
const trap = (id: string, expect: 'YES' | 'NO', icon: string): Item => ({
  id, kind: 'TRAP', group: 'ENJOY', loads: {}, icon, textKey: 'q.' + id, fun: 0.4, expect,
})
const deal = (id: string, excludes: string[], icon: string): Item => ({
  id, kind: 'CARD', group: 'DEALBREAKER', loads: {}, icon, textKey: 'q.' + id, fun: 0.3, excludes,
})

export const ITEMS: Item[] = [
  // ---- warm-up friendly (one per theme) ----
  card('c001', 'ENJOY', { R: 0.8 }, '\u{1F527}', { warm: true, theme: 'hands', fun: 0.8 }),
  card('c005', 'ENJOY', { A: 0.5, E: 0.3, visibility: 0.6 }, '\u{1F3AD}', { warm: true, theme: 'people', fun: 0.9 }),
  card('c011', 'ENJOY', { A: 0.8 }, '\u{1F3A8}', { warm: true, theme: 'make', fun: 0.8 }),
  card('c016', 'ENJOY', { A: 0.7, visibility: 0.2 }, '\u{1F4F7}', { warm: true, theme: 'screen', fun: 0.8 }),
  // ---- interests (RIASEC) ----
  card('c012', 'ENJOY', { R: 0.8 }, '\u2699\uFE0F'),
  card('c013', 'ENJOY', { R: 0.7, outdoors: 0.3 }, '\u{1F331}'),
  card('c014', 'ENJOY', { I: 0.8 }, '\u{1F52C}'),
  card('c015', 'ENJOY', { I: 0.7 }, '\u{1F4D6}'),
  card('c008', 'ENJOY', { S: 0.8 }, '\u{1F4DD}'),
  card('c017', 'ENJOY', { S: 0.8, helping: 0.5 }, '\u{1F91D}'),
  card('c018', 'PRACTICE', { S: 0.6, E: 0.2 }, '\u{1F4AC}'),
  card('c009', 'ENJOY', { E: 0.8, social_energy: 0.4 }, '\u{1F6D2}'),
  card('c019', 'ENJOY', { E: 0.7, social_energy: 0.3 }, '\u{1F451}'),
  card('c020', 'ENJOY', { E: 0.5, independence: 0.7, risk: 0.4 }, '\u{1F680}'),
  card('c006', 'ENJOY', { C: 0.8 }, '\u{1F4B0}'),
  card('c021', 'ENJOY', { C: 0.7, structure: 0.3 }, '\u{1F4CB}'),
  card('c022', 'ENJOY', { C: 0.6, structure: 0.3 }, '\u{1F50D}'),
  card('c004', 'STYLE', { social_energy: -0.5, I: 0.3 }, '\u{1F9D8}'),
  // ---- style pairs (reverse twins) ----
  card('c002', 'STYLE', { social_energy: -0.9 }, '\u{1F319}'),
  card('c003', 'STYLE', { social_energy: 0.9 }, '\u26A1', { twinOf: 'c002' }),
  card('c007', 'STYLE', { structure: 0.8 }, '\u{1F5D3}\uFE0F'),
  card('c023', 'STYLE', { structure: -0.8 }, '\u{1F3B2}', { twinOf: 'c007' }),
  card('c024', 'STYLE', { pace: 0.8 }, '\u{1F525}'),
  card('c025', 'STYLE', { pace: -0.8 }, '\u{1F422}', { twinOf: 'c024' }),
  card('c026', 'STYLE', { physical: 0.8 }, '\u{1F3C3}'),
  card('c027', 'STYLE', { physical: -0.8 }, '\u{1FA91}', { twinOf: 'c026' }),
  card('c010', 'STYLE', { outdoors: 0.8, R: 0.3 }, '\u2600\uFE0F'),
  card('c028', 'STYLE', { outdoors: -0.8 }, '\u{1F3E0}', { twinOf: 'c010' }),
  card('c029', 'STYLE', { risk: 0.8 }, '\u{1F9ED}'),
  card('c030', 'STYLE', { risk: -0.8, security: 0.3 }, '\u{1F6E1}\uFE0F', { twinOf: 'c029' }),
  card('c031', 'STYLE', { visibility: 0.8 }, '\u{1F31F}'),
  card('c032', 'STYLE', { visibility: -0.8 }, '\u{1F92B}', { twinOf: 'c031' }),
  card('c033', 'STYLE', { independence: 0.8 }, '\u{1F3AF}'),
  card('c034', 'STYLE', { independence: -0.8 }, '\u{1F46B}', { twinOf: 'c033' }),
  // ---- motives (thinking cards) ----
  card('c035', 'MOTIVE', { autonomy: 0.8 }, '\u{1F5DD}\uFE0F', { heavy: true }),
  card('c036', 'MOTIVE', { mastery: 0.8 }, '\u{1F3C6}', { heavy: true }),
  card('c037', 'MOTIVE', { helping: 0.8, S: 0.2 }, '\u2764\uFE0F', { heavy: true }),
  card('c038', 'MOTIVE', { security: 0.8 }, '\u{1F3E6}', { heavy: true }),
  card('c039', 'MOTIVE', { status: 0.8 }, '\u{1F396}\uFE0F', { heavy: true }),
  card('c040', 'MOTIVE', { community_impact: 0.8 }, '\u{1F3D8}\uFE0F', { heavy: true }),
  // ---- motive reverse twins (yes-saying check) ----
  card('c041', 'MOTIVE', { autonomy: -0.8 }, '\u{1F4CF}', { heavy: true, twinOf: 'c035' }),
  card('c042', 'MOTIVE', { mastery: -0.8 }, '\u{1F308}', { heavy: true, twinOf: 'c036' }),
  card('c043', 'MOTIVE', { helping: -0.8 }, '\u{1F9D1}', { heavy: true, twinOf: 'c037' }),
  card('c044', 'MOTIVE', { security: -0.8 }, '\u{1F3A2}', { heavy: true, twinOf: 'c038' }),
  card('c045', 'MOTIVE', { status: -0.8 }, '\u{1F54A}\uFE0F', { heavy: true, twinOf: 'c039' }),
  card('c046', 'MOTIVE', { community_impact: -0.8 }, '\u{1F3E1}', { heavy: true, twinOf: 'c040' }),
  // ---- forced pairs (immune to yes-saying) ----
  pick2('f001', ['\u{1F527}', { R: 0.8 }], ['\u{1F4AC}', { S: 0.6, social_energy: 0.4 }]),
  pick2('f002', ['\u{1F4D2}', { C: 0.8 }], ['\u{1F3A8}', { A: 0.8 }]),
  pick2('f003', ['\u2600\uFE0F', { outdoors: 0.8, R: 0.3 }], ['\u{1F3E0}', { outdoors: -0.8, C: 0.2 }]),
  pick2('f004', ['\u{1F451}', { E: 0.8 }], ['\u{1F4A1}', { I: 0.8 }]),
  pick2('f005', ['\u{1F6E1}\uFE0F', { security: 0.8, risk: -0.5 }], ['\u{1F680}', { risk: 0.8, status: 0.3 }]),
  pick2('f006', ['\u{1F9D8}', { social_energy: -0.8, independence: 0.3 }], ['\u{1F46B}', { social_energy: 0.6, independence: -0.5 }]),
  pick2('f007', ['\u{1F4DD}', { S: 0.8 }], ['\u{1F6D2}', { E: 0.8 }]),
  pick2('f008', ['\u{1F525}', { pace: 0.8 }], ['\u{1F422}', { pace: -0.8 }]),
  // ---- attention checks (obvious answer) ----
  trap('t001', 'NO', '\u{1F37D}\uFE0F'),
  trap('t002', 'NO', '\u{1F31E}'),
  trap('t003', 'YES', '\u2705'),
  // ---- dealbreakers (asked only when a leading path needs them) ----
  deal('d001', ['construction'], '\u{1F50A}'),
  deal('d002', ['hair', 'cooking', 'construction'], '\u{1F9CD}'),
  deal('d003', ['sales', 'tourism', 'interpreting'], '\u{1F5E3}\uFE0F'),
  deal('d004', ['farming', 'construction', 'driving'], '\u{1F327}\uFE0F'),
  deal('d005', ['tourism', 'driving'], '\u{1F9F3}'),
  deal('d006', ['webapp', 'media', 'bookkeeping'], '\u{1F4BB}'),
]
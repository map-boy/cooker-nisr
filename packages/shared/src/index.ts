// Shared vocabulary. The engine only ever sees ids and numbers (R1): all words live in i18n files.

export const RIASEC = ['R', 'I', 'A', 'S', 'E', 'C'] as const
export const STYLE_DIMS = ['social_energy', 'structure', 'pace', 'physical', 'outdoors', 'risk', 'visibility', 'independence'] as const
export const MOTIVES = ['autonomy', 'mastery', 'helping', 'security', 'status', 'community_impact'] as const
export const DIMS = [...RIASEC, ...STYLE_DIMS, ...MOTIVES] as const

export type Riasec = (typeof RIASEC)[number]
export type StyleDim = (typeof STYLE_DIMS)[number]
export type Motive = (typeof MOTIVES)[number]
export type Dim = (typeof DIMS)[number]
export type Loads = Partial<Record<Dim, number>>

export type Answer = 'YES' | 'SOMETIMES' | 'NO' | 'SKIP'
export type Choice = 'A' | 'B' | 'SKIP'
export type Response = Answer | Choice
// SKIP = "not sure / don't know" -> never counted as NO
export const ANSWER_VALUE: Record<Answer, number> = { YES: 1, SOMETIMES: 0.3, NO: -1, SKIP: 0 }

export type Group = 'ENJOY' | 'PRACTICE' | 'STYLE' | 'MOTIVE' | 'EFFICACY' | 'ASPIRE' | 'DEALBREAKER'
export type Source = 'OUTCOME' | 'PRACTICE' | 'FORCED' | 'ENJOY' | 'STYLE' | 'MOTIVE' | 'EFFICACY' | 'ASPIRE'
export const RELIABILITY: Record<Source, number> = {
  OUTCOME: 1.0, PRACTICE: 1.0, FORCED: 0.9, ENJOY: 0.8, STYLE: 0.7, MOTIVE: 0.7, EFFICACY: 0.7, ASPIRE: 0.3,
}

export interface Option { textKey: string; icon: string; loads: Loads }

export interface Item {
  id: string
  kind: 'CARD' | 'PICK2' | 'TRAP'
  group: Group
  loads: Loads            // direction of a YES answer (CARD). A reverse twin simply has opposite signs.
  a?: Option              // PICK2 only
  b?: Option
  twinOf?: string         // reverse-keyed partner (detects yes-saying + inconsistency)
  excludes?: string[]     // DEALBREAKER only: path ids ruled out by a NO
  expect?: 'YES' | 'NO'   // TRAP only
  icon: string
  textKey: string
  fun: number             // 0..1
  heavy?: boolean
  warm?: boolean          // allowed as one of the first 3 cards
  theme?: string          // warm-up variety
}

export interface Tile { id: string; icon: string; textKey: string; loads: Loads; tags: string[] }

export const BARRIERS = ['money', 'data', 'education', 'tools', 'location', 'time'] as const
export type Barrier = (typeof BARRIERS)[number]
export type BarrierLevels = Record<Barrier, number> // 0..3

export interface Path {
  id: string
  nameKey: string
  cluster: string
  tags: string[]
  interest: Partial<Record<Riasec, number>>                 // 0..1
  style: Partial<Record<StyleDim, [number, number]>>        // [target -1..1, importance 0..1]
  motives: Partial<Record<Motive, number>>                  // 0..1
  barrier: BarrierLevels                                    // what the path demands, 0..3
  cashLane: boolean
  bridge?: string                                           // lower-barrier doorway into this path
  demand?: number                                           // 0..1 from NISR LFS (see content/demand.ts)
}

export type AgeBand = 'UNDER18' | '18-24' | '25-39' | '40+'
export type Situation = 'SCHOOL' | 'FINISHED_NO_WORK' | 'WORKING' | 'OWN_BUSINESS' | 'FARMING' | 'ABROAD_OR_RETURNED' | 'OTHER'
export interface Context { ageBand: AgeBand; situation: Situation; capital: BarrierLevels; dependents?: boolean }

export interface Content { items: Item[]; tiles: Tile[]; paths: Path[] }

export type Flag = 'YES_SAYER' | 'NO_SAYER' | 'CARELESS' | 'INCONSISTENT' | 'FATIGUE' | 'REDO'
export type Confidence = 'LOW' | 'MEDIUM' | 'HIGH'
export const CONF_RANK: Record<Confidence, number> = { LOW: 0, MEDIUM: 1, HIGH: 2 }

export const sign = (x: number): number => (x > 0 ? 1 : x < 0 ? -1 : 0)
export const clamp = (x: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, x))
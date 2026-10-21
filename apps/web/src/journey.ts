export const KEY = 'cooker.journey'

// L0 watch | L1 copy | L2 make small | L3 show | L4 ask. social: 0 alone, 1 by message, 2 face to face
export const LEVELS = [
  { minutes: 20, social: 0 },
  { minutes: 25, social: 0 },
  { minutes: 30, social: 0 },
  { minutes: 20, social: 1 },
  { minutes: 15, social: 2 },
]

export type Liked = 'LIKED' | 'OK'

export interface Journey {
  pathId: string
  startedAt: string
  level: number
  done: Record<number, Liked>
  days: string[]
  blocked: string | null
  minor?: boolean
  hints?: string[]
  social: number
}

export function hintsFor(c: { data: number; money: number; time: number }, rules: string[]): string[] {
  const h: string[] = []
  if (c.data <= 1) h.push('NO_DATA')
  if (c.money === 0) h.push('NO_MONEY')
  if (c.time <= 1 || rules.includes('SIDE_START_15MIN')) h.push('LOW_TIME')
  if (rules.includes('SCHOOL_COMPATIBLE')) h.push('SCHOOL')
  return h
}

export const todayStr = (): string => new Date().toLocaleDateString('en-CA')

export function loadJourney(): Journey | null {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return null
    const j = JSON.parse(raw) as Journey
    return j && typeof j.pathId === 'string' && typeof j.level === 'number' ? j : null
  } catch {
    return null
  }
}

export function saveJourney(j: Journey | null): void {
  try {
    if (j) localStorage.setItem(KEY, JSON.stringify(j))
    else localStorage.removeItem(KEY)
  } catch {
    /* storage can be blocked; ignore */
  }
}

// consecutive days with a finished step, ending today (or yesterday, so the streak is not lost before you act)
export function streak(days: string[]): number {
  const set = new Set(days)
  const d = new Date()
  if (!set.has(d.toLocaleDateString('en-CA'))) d.setDate(d.getDate() - 1)
  let n = 0
  while (set.has(d.toLocaleDateString('en-CA'))) {
    n++
    d.setDate(d.getDate() - 1)
  }
  return n
}
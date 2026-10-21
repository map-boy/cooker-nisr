import type { AgeBand, Context, Situation } from '@cooker/shared'

export interface QOpt { id: string; icon: string }
export interface Q { id: string; icon: string; opts: QOpt[] }

// 8 taps. Text keys: ctx.<q.id> and ctx.<q.id>.<opt.id>
export const QS: Q[] = [
  { id: 'age', icon: '\u{1F382}', opts: [
    { id: 'UNDER18', icon: '\u{1F9D2}' }, { id: '18-24', icon: '\u{1F9D1}' }, { id: '25-39', icon: '\u{1F468}' }, { id: '40+', icon: '\u{1F474}' } ] },
  { id: 'situation', icon: '\u{1F9ED}', opts: [
    { id: 'SCHOOL', icon: '\u{1F392}' }, { id: 'FINISHED_NO_WORK', icon: '\u{1F50D}' }, { id: 'WORKING', icon: '\u{1F4BC}' },
    { id: 'OWN_BUSINESS', icon: '\u{1F3EA}' }, { id: 'FARMING', icon: '\u{1F33E}' }, { id: 'ABROAD_OR_RETURNED', icon: '\u2708\uFE0F' }, { id: 'OTHER', icon: '\u2753' } ] },
  { id: 'education', icon: '\u{1F4DA}', opts: [
    { id: 'NONE_PRIMARY', icon: '\u{1F4D6}' }, { id: 'SECONDARY', icon: '\u{1F3EB}' }, { id: 'TVET', icon: '\u{1F6E0}\uFE0F' }, { id: 'UNIVERSITY', icon: '\u{1F393}' } ] },
  { id: 'time', icon: '\u23F3', opts: [
    { id: 'LOW', icon: '\u{1F551}' }, { id: 'MID', icon: '\u{1F555}' }, { id: 'HIGH', icon: '\u{1F559}' } ] },
  { id: 'money', icon: '\u{1FA99}', opts: [
    { id: 'NOTHING', icon: '\u{1F6AB}' }, { id: 'A_LITTLE', icon: '\u{1F4B5}' }, { id: 'SOME', icon: '\u{1F4B0}' } ] },
  { id: 'data', icon: '\u{1F4F6}', opts: [
    { id: 'NO_DATA', icon: '\u{1F4F5}' }, { id: 'SOMETIMES', icon: '\u{1F4F6}' }, { id: 'YES', icon: '\u{1F310}' } ] },
  { id: 'device', icon: '\u{1F4F1}', opts: [
    { id: 'BASIC', icon: '\u{1F4DE}' }, { id: 'SMARTPHONE', icon: '\u{1F4F1}' }, { id: 'COMPUTER', icon: '\u{1F4BB}' } ] },
  { id: 'area', icon: '\u{1F5FA}\uFE0F', opts: [
    { id: 'URBAN', icon: '\u{1F3D9}\uFE0F' }, { id: 'RURAL', icon: '\u{1F304}' } ] },
]

const EDU: Record<string, number> = { NONE_PRIMARY: 0, SECONDARY: 1, TVET: 2, UNIVERSITY: 3 }
const TIME: Record<string, number> = { LOW: 1, MID: 2, HIGH: 3 }
const MONEY: Record<string, number> = { NOTHING: 0, A_LITTLE: 1, SOME: 2 }
const DATA: Record<string, number> = { NO_DATA: 0, SOMETIMES: 2, YES: 3 }
const TOOLS: Record<string, number> = { BASIC: 1, SMARTPHONE: 2, COMPUTER: 3 }
const AREA: Record<string, number> = { RURAL: 1, URBAN: 3 }

export function buildContext(a: Record<string, string>): Context {
  return {
    ageBand: (a.age ?? '18-24') as AgeBand,
    situation: (a.situation ?? 'OTHER') as Situation,
    dependents: false,
    capital: {
      money: MONEY[a.money] ?? 0,
      data: DATA[a.data] ?? 0,
      education: EDU[a.education] ?? 0,
      tools: TOOLS[a.device] ?? 1,
      location: AREA[a.area] ?? 1,
      time: TIME[a.time] ?? 1,
    },
  }
}
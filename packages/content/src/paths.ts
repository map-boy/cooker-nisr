import type { BarrierLevels, Path } from '@cooker/shared'

// barrier = what the path DEMANDS (0..3). Weights are expert guesses until real outcomes exist (C3).
const b = (money: number, data: number, education: number, tools: number, location: number, time: number): BarrierLevels => ({
  money, data, education, tools, location, time,
})
const p = (id: string, cluster: string, tags: string[], p: Omit<Path, 'id' | 'nameKey' | 'cluster' | 'tags'>): Path => ({
  id, nameKey: 'path.' + id, cluster, tags, ...p,
})

export const PATHS: Path[] = [
  p('journalism', 'media', ['story', 'media', 'talk'], {
    interest: { A: 0.8, I: 0.5, E: 0.4, S: 0.3 },
    style: { social_energy: [0.4, 0.4], visibility: [0.6, 0.6], risk: [0.3, 0.3], pace: [0.5, 0.4] },
    motives: { community_impact: 0.8, status: 0.4, mastery: 0.3 },
    barrier: b(1, 2, 2, 1, 1, 1), cashLane: false, bridge: 'media',
  }),
  p('repair', 'hands', ['fix', 'tools', 'tech'], {
    interest: { R: 0.9, I: 0.5, C: 0.2 },
    style: { social_energy: [-0.2, 0.3], structure: [0.2, 0.3], physical: [0.3, 0.2], independence: [0.5, 0.5], pace: [0.2, 0.2] },
    motives: { mastery: 0.7, autonomy: 0.6, security: 0.4 },
    barrier: b(2, 1, 1, 2, 0, 1), cashLane: true,
  }),
  p('tailoring', 'make', ['make', 'fashion', 'hands'], {
    interest: { A: 0.7, R: 0.6, C: 0.3 },
    style: { social_energy: [0, 0.2], structure: [0.4, 0.4], pace: [-0.2, 0.4], physical: [-0.2, 0.3], independence: [0.6, 0.5] },
    motives: { mastery: 0.6, autonomy: 0.6, security: 0.3 },
    barrier: b(2, 0, 1, 2, 0, 2), cashLane: true,
  }),
  p('farming', 'land', ['farm', 'outdoor', 'land'], {
    interest: { R: 0.8, I: 0.4, E: 0.3, C: 0.3 },
    style: { outdoors: [0.9, 0.8], physical: [0.8, 0.6], structure: [0.3, 0.3], risk: [0.2, 0.3], independence: [0.6, 0.4], pace: [-0.2, 0.3] },
    motives: { security: 0.5, community_impact: 0.6, autonomy: 0.5 },
    barrier: b(1, 0, 0, 1, 1, 2), cashLane: true,
  }),
  p('cooking', 'food', ['food', 'cook', 'hands'], {
    interest: { R: 0.6, A: 0.6, E: 0.5, S: 0.3 },
    style: { pace: [0.7, 0.6], physical: [0.6, 0.5], social_energy: [0.3, 0.3], structure: [0.4, 0.3] },
    motives: { security: 0.4, status: 0.3, autonomy: 0.4 },
    barrier: b(2, 0, 0, 1, 1, 2), cashLane: true,
  }),
  p('hair', 'people-care', ['beauty', 'hands', 'people'], {
    interest: { A: 0.7, S: 0.6, E: 0.3, R: 0.3 },
    style: { social_energy: [0.5, 0.5], physical: [0.4, 0.4], visibility: [0.3, 0.3], independence: [0.5, 0.4] },
    motives: { helping: 0.4, mastery: 0.5, autonomy: 0.5 },
    barrier: b(2, 0, 1, 2, 0, 2), cashLane: true,
  }),
  p('teaching', 'people-care', ['teach', 'people', 'learn'], {
    interest: { S: 0.9, I: 0.5, A: 0.3, C: 0.3 },
    style: { social_energy: [0.4, 0.5], structure: [0.5, 0.4], visibility: [0.4, 0.3], pace: [-0.1, 0.3] },
    motives: { helping: 0.9, community_impact: 0.7, mastery: 0.4, security: 0.4 },
    barrier: b(0, 1, 2, 0, 0, 2), cashLane: true,
  }),
  p('sales', 'trade', ['sell', 'talk', 'people', 'shop'], {
    interest: { E: 0.9, S: 0.4, C: 0.4 },
    style: { social_energy: [0.8, 0.8], risk: [0.5, 0.5], pace: [0.5, 0.4], visibility: [0.4, 0.3], independence: [0.4, 0.3], physical: [0.3, 0.2] },
    motives: { status: 0.5, autonomy: 0.4, security: 0.3 },
    barrier: b(1, 0, 0, 0, 0, 2), cashLane: true,
  }),
  p('bookkeeping', 'trade', ['numbers', 'shop', 'records'], {
    interest: { C: 0.95, I: 0.4, E: 0.2 },
    style: { structure: [0.8, 0.8], social_energy: [-0.3, 0.4], pace: [-0.3, 0.3], physical: [-0.6, 0.3], visibility: [-0.5, 0.3], risk: [-0.5, 0.4] },
    motives: { security: 0.7, mastery: 0.4 },
    barrier: b(0, 1, 2, 1, 0, 1), cashLane: true,
  }),
  p('webapp', 'tech', ['code', 'tech', 'screen'], {
    interest: { I: 0.8, A: 0.5, C: 0.5, R: 0.3 },
    style: { social_energy: [-0.6, 0.6], independence: [0.5, 0.5], structure: [0.2, 0.2], physical: [-0.7, 0.4], pace: [-0.1, 0.2] },
    motives: { mastery: 0.9, autonomy: 0.6 },
    barrier: b(1, 3, 2, 3, 0, 2), cashLane: false, bridge: 'repair',
  }),
  p('media', 'media', ['photo', 'video', 'design', 'make', 'media', 'screen'], {
    interest: { A: 0.95, I: 0.3, E: 0.3 },
    style: { social_energy: [-0.3, 0.3], visibility: [0.2, 0.2], independence: [0.6, 0.5], physical: [-0.3, 0.2], risk: [0.3, 0.3] },
    motives: { mastery: 0.7, autonomy: 0.7, status: 0.3 },
    barrier: b(1, 2, 1, 2, 0, 2), cashLane: true,
  }),
  p('tourism', 'people-care', ['tour', 'talk', 'people', 'outdoor'], {
    interest: { S: 0.6, E: 0.6, A: 0.3, R: 0.3 },
    style: { social_energy: [0.8, 0.7], outdoors: [0.5, 0.5], visibility: [0.5, 0.4], risk: [0.4, 0.3], pace: [0.4, 0.3], physical: [0.4, 0.3] },
    motives: { community_impact: 0.5, status: 0.3, helping: 0.4 },
    barrier: b(1, 1, 1, 0, 1, 2), cashLane: false,
  }),
  p('interpreting', 'language', ['language', 'talk', 'people'], {
    interest: { S: 0.5, I: 0.5, A: 0.3, C: 0.3 },
    style: { social_energy: [0.2, 0.2], structure: [0.4, 0.3], pace: [0.2, 0.2], physical: [-0.5, 0.3] },
    motives: { helping: 0.5, mastery: 0.6, security: 0.4 },
    barrier: b(0, 1, 2, 1, 0, 1), cashLane: false,
  }),
  p('construction', 'hands', ['build', 'tools', 'hands', 'outdoor'], {
    interest: { R: 0.95, C: 0.2 },
    style: { physical: [0.9, 0.8], outdoors: [0.7, 0.6], pace: [0.4, 0.4], social_energy: [0, 0.1], structure: [0.2, 0.2] },
    motives: { security: 0.5, mastery: 0.4 },
    barrier: b(1, 0, 1, 2, 0, 2), cashLane: true,
  }),
  p('driving', 'move', ['drive', 'move'], {
    interest: { R: 0.6, C: 0.4, E: 0.2 },
    style: { structure: [0.3, 0.3], physical: [0.2, 0.2], social_energy: [0.1, 0.1], independence: [0.5, 0.4], risk: [0.2, 0.2] },
    motives: { security: 0.6, autonomy: 0.4 },
    barrier: b(2, 0, 1, 3, 0, 2), cashLane: false,
  }),
]
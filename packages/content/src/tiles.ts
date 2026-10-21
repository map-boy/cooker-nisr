import type { Loads, Tile } from '@cooker/shared'

const t = (id: string, icon: string, loads: Loads, tags: string[]): Tile => ({ id, icon, textKey: 'tile.' + id, loads, tags })

// "What do you do and forget the time?" - revealed behavior (the most honest signal)
export const TILES: Tile[] = [
  t('football', '\u26BD', { physical: 0.7, outdoors: 0.5, social_energy: 0.4 }, ['sport', 'people']),
  t('cooking', '\u{1F373}', { R: 0.5, A: 0.4 }, ['food', 'cook']),
  t('fixing', '\u{1F4F1}', { R: 0.8, I: 0.3 }, ['fix', 'tech', 'tools']),
  t('drawing', '\u{1F58C}\uFE0F', { A: 0.9 }, ['design', 'make', 'media']),
  t('chatting', '\u{1F5E8}\uFE0F', { social_energy: 0.6, S: 0.3 }, ['talk', 'people']),
  t('farming', '\u{1F33E}', { R: 0.7, outdoors: 0.7 }, ['farm', 'outdoor', 'land']),
  t('sewing', '\u{1F9F5}', { A: 0.6, R: 0.4 }, ['fashion', 'make', 'hands']),
  t('hair', '\u{1F487}', { A: 0.6, S: 0.4 }, ['beauty', 'hands', 'people']),
  t('teaching', '\u{1F9D2}', { S: 0.9 }, ['teach', 'learn', 'people']),
  t('selling', '\u{1F6CD}\uFE0F', { E: 0.9, social_energy: 0.4 }, ['sell', 'shop', 'talk']),
  t('counting', '\u{1F9EE}', { C: 0.9 }, ['numbers', 'records', 'shop']),
  t('coding', '\u{1F4BB}', { I: 0.7, C: 0.4 }, ['code', 'tech', 'screen']),
  t('photo', '\u{1F3AC}', { A: 0.8 }, ['photo', 'video', 'media', 'make']),
  t('music', '\u{1F3B5}', { A: 0.7, visibility: 0.6 }, ['make', 'people']),
  t('writing', '\u270D\uFE0F', { A: 0.7, I: 0.3 }, ['story', 'media']),
  t('news', '\u{1F4FB}', { I: 0.5, A: 0.3, S: 0.2 }, ['story', 'media', 'talk']),
  t('guiding', '\u{1F9ED}', { S: 0.5, E: 0.4 }, ['tour', 'people', 'outdoor', 'talk']),
  t('languages', '\u{1F310}', { S: 0.4, I: 0.4 }, ['language', 'talk']),
  t('building', '\u{1F9F1}', { R: 0.9 }, ['build', 'tools', 'hands']),
  t('driving', '\u{1F3CD}\uFE0F', { R: 0.5 }, ['drive', 'move']),
  t('animals', '\u{1F404}', { R: 0.6, S: 0.2 }, ['farm', 'outdoor']),
  t('games', '\u{1F9E9}', { I: 0.8 }, ['learn', 'tech']),
  t('events', '\u{1F389}', { E: 0.6, C: 0.4, S: 0.3 }, ['people', 'talk']),
  t('neighbors', '\u{1F91D}', { S: 0.8, community_impact: 0.6 }, ['people', 'teach']),
]
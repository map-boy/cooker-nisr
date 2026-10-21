import type { LangCode } from './langs'
import contentEn from '../../../packages/content/i18n/en.json'
import journeyEn from '../../../packages/content/i18n/journey.en.json'
import pushEn from '../../../packages/content/i18n/push.en.json'

export type Dict = Record<string, string>

// one small JSON per language, loaded only when chosen (data-light)
const loaders = import.meta.glob('./i18n/*.json', { import: 'default' }) as Record<string, () => Promise<Dict>>

async function get(code: string): Promise<Dict> {
  const load = loaders[`./i18n/${code}.json`]
  return load ? await load() : {}
}

// order: content English < journey English < push English < UI English < chosen language.
// Missing keys fall back to English until a language is reviewed (R7).
export async function loadDict(lang: LangCode, fallback: LangCode = 'en'): Promise<Dict> {
  const [base, main] = await Promise.all([get(fallback), get(lang)])
  return { ...(contentEn as Dict), ...(journeyEn as Dict), ...(pushEn as Dict), ...base, ...main }
}
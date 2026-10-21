// Each language is written in its OWN language/script. No flags (a flag is not a language).
// Non-ASCII names use \u escapes so this file is safe to paste through any terminal.
export const LANGS = [
  { code: 'rw', native: 'Ikinyarwanda', dir: 'ltr' },
  { code: 'en', native: 'English', dir: 'ltr' },
  { code: 'fr', native: 'Fran\u00E7ais', dir: 'ltr' },
  { code: 'ar', native: '\u0627\u0644\u0639\u0631\u0628\u064A\u0629', dir: 'rtl' },
  { code: 'sw', native: 'Kiswahili', dir: 'ltr' },
  { code: 'lg', native: 'Luganda', dir: 'ltr' },
] as const

export type LangCode = (typeof LANGS)[number]['code']
export type Lang = (typeof LANGS)[number]
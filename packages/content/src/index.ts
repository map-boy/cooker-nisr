import type { Content } from '@cooker/shared'
import { ITEMS } from './items'
import { PATHS } from './paths'
import { TILES } from './tiles'
import { DEMAND } from './demand'

export { ITEMS, PATHS, TILES, DEMAND }
export const CONTENT_VERSION = '0.1.0-en'
export const CONTENT: Content = { items: ITEMS, tiles: TILES, paths: PATHS.map((p) => ({ ...p, demand: DEMAND[p.id]?.demand })) }
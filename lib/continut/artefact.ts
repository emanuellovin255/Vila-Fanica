import { mkdirSync, writeFileSync } from 'node:fs'
import path from 'node:path'

import type { SiteData } from '@/content/types'

/**
 * Scrie `content/site.json` — util la debug și pentru inspecție rapidă.
 *
 * E ARTEFACT, nu sursă (T05). Sursa de adevăr rămân fișierele `.md`.
 * De asta e în `.gitignore`: dacă ar intra în repo, cineva l-ar putea
 * edita crezând că schimbă site-ul, iar următorul build i-ar șterge
 * modificarea fără avertisment.
 */
export function scrieArtefact(date: SiteData, radacinaMotor = process.cwd()): string {
  const dir = path.join(radacinaMotor, 'content')
  mkdirSync(dir, { recursive: true })
  const cale = path.join(dir, 'site.json')
  writeFileSync(cale, JSON.stringify(date, null, 2), 'utf8')
  return cale
}

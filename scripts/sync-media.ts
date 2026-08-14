/**
 * Copiază pozele clientului activ în `public/media`, de unde le servește
 * Next. Rulează automat înainte de `dev` și `build` (predev / prebuild),
 * ca „am pus o poză nouă în poze/" să funcționeze fără un pas manual.
 *
 * Scrie și `content/poze.json` — lista de nume din `poze/`. Loader-ul are
 * nevoie de ea la RULARE (paginile se randează la cerere, ca să poarte
 * nonce-ul CSP), iar pe Vercel funcția serverless primește doar fișierele
 * urmărite. `poze/` are zeci de MB și n-are ce căuta într-o funcție; lista
 * de nume are câțiva KB și e tot ce se cere.
 *
 * `public/media` și `content/poze.json` sunt artefacte de build (în
 * .gitignore) — se regenerează.
 * No-op tăcut dacă nu există un client activ sau un folder `poze/`.
 */
import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { radacinaClientDir } from '../lib/continut/radacina'

const MOTOR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

const marker = path.join(MOTOR, '.client-activ')
if (!existsSync(marker)) process.exit(0)

const nume = readFileSync(marker, 'utf8').trim()
if (!nume) process.exit(0)

const poze = path.join(radacinaClientDir(nume), 'poze')
if (!existsSync(poze)) process.exit(0)

const media = path.join(MOTOR, 'public', 'media')
mkdirSync(media, { recursive: true })

const nume_poze: string[] = []
for (const f of readdirSync(poze)) {
  // `.md` e ghidul folderului (`poze/README.md`), nu o poză de servit.
  if (f.startsWith('.') || f.endsWith('.md')) continue
  copyFileSync(path.join(poze, f), path.join(media, f))
  nume_poze.push(f)
}

const continut = path.join(MOTOR, 'content')
mkdirSync(continut, { recursive: true })
writeFileSync(path.join(continut, 'poze.json'), JSON.stringify(nume_poze, null, 2) + '\n')

if (nume_poze.length) console.log(`  sync-media: ${nume_poze.length} poze → public/media`)

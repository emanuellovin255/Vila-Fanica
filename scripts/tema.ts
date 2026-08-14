/**
 * Generează `styles/tokens.client.css` — stratul de temă al clientului activ.
 *
 * DE CE EXISTĂ FIȘIERUL ĂSTA
 * --------------------------
 * `styles/tokens.css` descria de la început o arhitectură în două straturi: un
 * strat de bază identic pentru toți, peste care „un client încarcă după el
 * propriul `tokens.client.css`, generat din `date/11-culori-si-fonturi.md`".
 * Stratul al doilea nu exista. Nimic din `app/`, `components/` sau `styles/` nu
 * citea `theme` din `SiteData`, deși `lib/continut/index.ts` îl parsa corect.
 *
 * Consecința era tăcută și de asta neplăcută: fiecare client scria 14 culori și
 * două fonturi în `date/11-culori-si-fonturi.md`, `npm run verifica` trecea fără
 * o vorbă, iar site-ul livrat randa tema neutră a motorului. Culorile măsurate
 * din logo cu `npm run analiza` nu ajungeau niciodată pe ecran.
 *
 * CE SCRIE
 * --------
 *   1. cele 14 culori marcate [CLIENT] în tokens.css, plus radius și tracking;
 *   2. `--font-display` / `--font-body`, cu stack-ul de rezervă al perechii;
 *   3. `@font-face`-urile fonturilor alese, servite din `/fonts` (REGULI.md 9 —
 *      niciun request către un CDN extern).
 *
 * FONTURILE SE DESCARCĂ O SINGURĂ DATĂ
 * ------------------------------------
 * `public/fonts/.tema.json` reține perechea instalată și e URMĂRIT în git, alături
 * de fișierele `.woff2`. Așa un clone curat se buildează fără să atingă rețeaua:
 * un deploy nu trebuie să depindă de Google Fonts ca să treacă.
 *
 * Dacă descărcarea eșuează totuși, nu cade buildul: se scriu culorile, se sare
 * peste `@font-face`, iar stack-ul cade pe fonturile de sistem, cu un
 * avertisment vizibil.
 *
 * No-op tăcut dacă nu există un client activ — motorul singur rămâne pe tema
 * lui neutră.
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { incarcaClient } from '../lib/continut'
import { installFonts, pickTypography } from './lib/fonts'
import type { Theme, Typography } from '../content/types'

const MOTOR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const IESIRE = path.join(MOTOR, 'styles', 'tokens.client.css')
const MANIFEST = path.join(MOTOR, 'public', 'fonts', '.tema.json')

const ANTET =
  '/* Generat de scripts/tema.ts din date/11-culori-si-fonturi.md.\n' +
  '   Nu se editează de mână — se rescrie la fiecare dev/build. */\n'

/** Fără client activ, fișierul tot trebuie să existe: layout.tsx îl importă. */
function neutru(motiv: string) {
  writeFileSync(IESIRE, `${ANTET}/* ${motiv} */\n`)
}

/** Exact cele 14 marcate [CLIENT] în tokens.css. `--on-accent` nu e una. */
function culori(tema: Theme): Array<[string, string]> {
  const c = tema.colors
  return [
    ['--canvas', c.canvas],
    ['--surface', c.surface],
    ['--surface-alt', c.surfaceAlt],
    ['--line', c.line],
    ['--ink', c.ink],
    ['--ink-soft', c.inkSoft],
    ['--muted', c.muted],
    ['--brand', c.brand],
    ['--brand-lift', c.brandLift],
    ['--on-brand', c.onBrand],
    ['--accent', c.accent],
    ['--accent-lift', c.accentLift],
    ['--positive', c.positive],
    ['--attention', c.attention],
  ]
}

/* ------------------------------------------------------------- tipografie */

/**
 * Perechea de bază vine din caracterul brandului. Dacă cineva a scris în
 * `date/11-culori-si-fonturi.md` alte nume de fonturi decât cele ale perechii,
 * numele scrise câștigă — indicația explicită bate default-ul — și li se
 * construiesc specificațiile pe greutățile obișnuite.
 */
function tipografie(tema: Theme): Typography {
  const pereche = pickTypography(tema.character)
  const display = tema.fonts.display || pereche.display
  const body = tema.fonts.body || pereche.body
  if (display === pereche.display && body === pereche.body) return pereche

  // Perechea proprie a motorului: stack-urile ei sunt cele din tokens.css, nu
  // rezervele generice de mai jos. Se ajunge aici când un client cere explicit
  // Satoshi+Inter peste un caracter a cărui pereche e alta.
  if (display === 'Satoshi' && body === 'Inter') {
    return {
      display,
      body,
      displaySpec: '',
      bodySpec: '',
      displayStack: `'Satoshi', 'Inter', system-ui, -apple-system, 'Segoe UI', sans-serif`,
      bodyStack: `'Inter', system-ui, -apple-system, 'Segoe UI', sans-serif`,
      displayTracking: tema.fonts.displayTracking || '-0.02em',
    }
  }

  const spec = (nume: string, greutati: string) => `${nume.replace(/\s+/g, '+')}:wght@${greutati}`
  // Rezervele nu se moștenesc de la perechea caracterului: dacă cineva cere
  // un display serif peste un caracter cu pereche sans, un fallback sans ar
  // schimba complet pagina în secunda dinaintea încărcării fontului.
  const REZERVA_DISPLAY = `Georgia, 'Times New Roman', serif`
  const REZERVA_TEXT = `-apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif`
  return {
    display,
    body,
    displaySpec: display === pereche.display ? pereche.displaySpec : spec(display, '400;700'),
    bodySpec: body === pereche.body ? pereche.bodySpec : spec(body, '400;500;600;700'),
    displayStack:
      display === pereche.display ? pereche.displayStack : `'${display}', ${REZERVA_DISPLAY}`,
    bodyStack: body === pereche.body ? pereche.bodyStack : `'${body}', ${REZERVA_TEXT}`,
    displayTracking: tema.fonts.displayTracking || pereche.displayTracking,
  }
}

/**
 * Perechea implicită a motorului e deja self-hosted și subsetată în
 * `styles/fonts.css` (68 KB pe disc, 51 KB pe o pagină în română). Descărcarea
 * ei de la Google ar adăuga peste 500 KB de fișiere duplicate, pentru exact
 * aceleași două familii.
 */
function eSetulMotorului(tip: Typography): boolean {
  return tip.display === 'Satoshi' && tip.body === 'Inter'
}

/** Perechea instalată deja pe disc, ca să nu se descarce la fiecare build. */
function fonturiInCache(tip: Typography): string | null {
  if (!existsSync(MANIFEST)) return null
  try {
    const m = JSON.parse(readFileSync(MANIFEST, 'utf8'))
    if (m.display !== tip.display || m.body !== tip.body) return null
    const lipsa = (m.fisiere ?? []).some(
      (f: string) => !existsSync(path.join(MOTOR, 'public', 'fonts', f)),
    )
    return lipsa ? null : (m.css ?? '')
  } catch {
    return null
  }
}

/* ------------------------------------------------------------------ main */

async function main() {
  const marker = path.join(MOTOR, '.client-activ')
  if (!existsSync(marker)) {
    return neutru('Niciun client activ — se folosește tema neutră din tokens.css.')
  }
  const nume = readFileSync(marker, 'utf8').trim()
  if (!nume) {
    return neutru('Marker de client gol — se folosește tema neutră din tokens.css.')
  }

  let tema: Theme
  try {
    tema = incarcaClient(nume).date.theme
  } catch (e) {
    return neutru(`Datele clientului nu s-au putut citi (${e instanceof Error ? e.message.trim() : e}).`)
  }

  const tip = tipografie(tema)
  let faces = eSetulMotorului(tip) ? '' : fonturiInCache(tip)
  let avertisment: string | undefined

  if (faces === null) {
    try {
      const r = await installFonts(tip, path.join(MOTOR, 'public'))
      faces = r.css
      avertisment = r.warning
      const fisiere = [...r.css.matchAll(/\/fonts\/([^']+\.woff2)/g)].map((m) => m[1])
      writeFileSync(
        MANIFEST,
        JSON.stringify({ display: tip.display, body: tip.body, fisiere, css: r.css }, null, 2) + '\n',
      )
      console.log(
        `  tema: ${tip.display} + ${tip.body} — ${r.files} fișiere, ${Math.round(r.bytes / 1024)} KB`,
      )
    } catch (e) {
      faces = ''
      avertisment =
        `Fonturile (${tip.display} + ${tip.body}) nu s-au putut descărca: ` +
        `${e instanceof Error ? e.message : e}. Textul cade pe fonturile de sistem.`
    }
  }

  writeFileSync(
    IESIRE,
    [
      ANTET,
      ':root {',
      ...culori(tema).map(([k, v]) => `  ${k}: ${v};`),
      '',
      `  --font-display: ${tip.displayStack};`,
      `  --font-body: ${tip.bodyStack};`,
      `  --display-tracking: ${tip.displayTracking};`,
      `  --radius: ${tema.radius};`,
      '}',
      '',
      faces,
      '',
    ].join('\n'),
  )

  if (avertisment) console.warn(`  tema: ${avertisment}`)
}

main()

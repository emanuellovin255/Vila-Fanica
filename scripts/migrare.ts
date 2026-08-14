/**
 * npm run migrare -- <url-site-vechi> [--client <slug>] [--gsc <fisier.csv>]
 *
 * Când înlocuim un site indexat, aici se pierd poziții în Google. Comanda
 * asta produce, ÎNAINTE de lansare:
 *
 *   clienti/<slug>/MIGRARE.md      – inventarul URL-urilor vechi + maparea 301
 *                                    propusă, plus checklistul de după lansare
 *   clienti/<slug>/redirecturi.ts  – `redirecturi` (Redirect[]) gata de pus în
 *                                    next.config.ts, toate cu `permanent: true`
 *   clienti/<slug>/urluri-vechi.txt – lista pentru verificarea 301 după deploy
 *
 * Reguli (din T33):
 *   · NU redirectează totul spre prima pagină — Google tratează asta ca soft 404
 *     și pierde semnalul paginii. O pagină fără echivalent direct merge spre cea
 *     mai apropiată categorie; dacă nici aia nu e clară, e MARCATĂ pentru decizie
 *     manuală, nu ghicită.
 *   · Nu inventează echivalente. Ce nu se potrivește evident se semnalează.
 *
 * Inventarul vine din trei surse combinate: sitemap.xml-ul lor, crawl-ul
 * paginii principale (linkuri interne) și — cea mai bună — Google Search
 * Console, dacă e dat un export CSV cu `--gsc` (arată ce aducea efectiv trafic).
 *
 * Rutele NOI se iau din clientul deja analizat (T30): loader-ul T05 →
 * `ruteleSitului`, deci maparea țintește exact paginile care chiar există.
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { incarcaClient } from '../lib/continut'
import { LIMBA_IMPLICITA, type Limba } from '../lib/i18n/limbi'
import { ruteleSitului } from '../lib/seo/rute'
import { radacinaRepo } from './lib/layout'
import { fetchPage, sameHost } from './lib/net'

const MOTOR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const REPO = radacinaRepo(MOTOR)
const CLIENTI = path.join(REPO, 'clienti')

// Loader-ul rezolvă clienții din cwd (rădăcina aplicației Next, ca `next build`).
process.chdir(MOTOR)

function arg(flag: string): string | undefined {
  const i = process.argv.indexOf(flag)
  return i > -1 ? process.argv[i + 1] : undefined
}

/* ------------------------------------------------------------------ */
/* Clasificarea unei căi vechi                                        */
/* ------------------------------------------------------------------ */

type Fel =
  | 'home' | 'rooms' | 'offers' | 'spa' | 'dining' | 'events'
  | 'contact' | 'about' | 'legal' | 'gallery' | 'other'

// Aceleași tipare ca `extract.ts`, plus legal/galerie (care acolo se ignorau).
const TIPARE: [Fel, RegExp][] = [
  ['rooms',   /camere|rooms|accommodation|cazare|apartament|suite/i],
  ['offers',  /oferte|offers|packages|pachete|promo/i],
  ['spa',     /spa|wellness|piscin|pool|sauna|masaj|massage/i],
  ['dining',  /restaurant|dining|meniu|menu|pub|bar|terasa|terrace/i],
  ['events',  /event|eveniment|conferint|conference|nunt|wedding|banquet|sala/i],
  ['gallery', /galerie|gallery|foto|photos|imagini/i],
  ['contact', /contact/i],
  ['about',   /despre|about|istorie|story|poveste/i],
  ['legal',   /politica|gdpr|termeni|cookie|privacy|terms|anulare|confiden/i],
]

function felul(cale: string): Fel {
  if (cale === '/' || cale === '') return 'home'
  for (const [fel, re] of TIPARE) if (re.test(cale)) return fel
  return 'other'
}

/** Ultimul segment ne-gol al unei căi — candidatul de slug de cameră/ofertă. */
function ultimulSegment(cale: string): string {
  const p = cale.replace(/\/+$/, '').split('/').filter(Boolean)
  return p[p.length - 1] ?? ''
}

/** Slug curat, ca la loader: fără diacritice, doar [a-z0-9-]. */
const slug = (s: string) =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[șş]/gi, 's').replace(/[țţ]/gi, 't')
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')

/** Câte cuvinte-token au în comun două slug-uri. Baza potrivirii de cameră. */
function suprapunere(a: string, b: string): number {
  const ta = new Set(a.split('-').filter((x) => x.length > 2))
  const tb = new Set(b.split('-').filter((x) => x.length > 2))
  let n = 0
  for (const t of ta) if (tb.has(t)) n++
  return n
}

/* ------------------------------------------------------------------ */
/* Inventarul URL-urilor vechi                                        */
/* ------------------------------------------------------------------ */

const ASSET = /\.(xml|kml|jpe?g|png|webp|gif|svg|pdf|zip|css|js|ico|woff2?|mp4)$/i

/** Toate `<loc>` dintr-un sitemap, urmărind și un sitemapindex. */
async function dinSitemap(root: URL, limita: number): Promise<string[]> {
  const out = new Set<string>()
  const candidate = new Set<string>()
  try {
    const robots = await fetchPage(new URL('/robots.txt', root).href, 10_000)
    for (const m of robots.body.matchAll(/Sitemap:\s*(\S+)/gi)) candidate.add(m[1].trim())
  } catch { /* fără robots.txt */ }
  candidate.add(new URL('/sitemap.xml', root).href)

  const vazute = new Set<string>()
  const coada = [...candidate]
  while (coada.length && out.size < limita) {
    const sm = coada.shift()!
    if (vazute.has(sm)) continue
    vazute.add(sm)
    let body: string
    try { body = (await fetchPage(sm, 15_000)).body } catch { continue }
    const locs = [...body.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].trim())
    const esteIndex = /<sitemapindex/i.test(body)
    for (const loc of locs) {
      if (esteIndex) { if (vazute.size + coada.length < 30) coada.push(loc); continue }
      out.add(loc)
      if (out.size >= limita) break
    }
  }
  return [...out]
}

/** Linkuri interne din pagina principală — completează sitemap-ul. */
async function dinPaginaPrincipala(root: URL, limita: number): Promise<string[]> {
  const out = new Set<string>()
  try {
    const home = await fetchPage(root.href)
    for (const m of home.body.matchAll(/href\s*=\s*["']([^"']+)["']/gi)) {
      if (out.size >= limita) break
      let abs: string
      try { abs = new URL(m[1], root.href).href } catch { continue }
      if (!sameHost(abs, root.href)) continue
      out.add(abs)
    }
  } catch { /* pagină principală necitibilă — raportat de apelant */ }
  return [...out]
}

/** URL-urile de top dintr-un export CSV din Search Console (coloana „Pagini de top"). */
function dinGsc(fisier: string): { url: string; clicks?: number }[] {
  const text = readFileSync(fisier, 'utf8')
  const linii = text.split(/\r?\n/).filter(Boolean)
  const out: { url: string; clicks?: number }[] = []
  for (const l of linii) {
    const celule = l.split(/[,;\t]/).map((c) => c.trim().replace(/^"|"$/g, ''))
    const url = celule.find((c) => /^https?:\/\//i.test(c))
    if (!url) continue // sare peste antet și rândurile fără URL
    const clicks = celule.map(Number).find((n) => Number.isFinite(n))
    out.push({ url, clicks })
  }
  return out
}

/** Cale curată, fără host, fără trailing slash, fără fragment/query. */
function caleDinUrl(u: string): string | null {
  try {
    const { pathname } = new URL(u)
    const c = pathname.replace(/\/+$/, '') || '/'
    return c
  } catch { return null }
}

/* ------------------------------------------------------------------ */
/* Maparea 301                                                        */
/* ------------------------------------------------------------------ */

interface Rand {
  vechi: string           // calea veche (source), fără prefix de limbă păstrat separat
  limba: Limba
  fel: Fel
  nou?: string            // calea nouă (destination), cu prefix de limbă
  sigur: boolean          // true = auto; false = de decis manual
  motiv: string
  clicks?: number
}

function faraPrefixLimba(cale: string): { limba: Limba; rest: string } {
  const m = cale.match(/^\/en(\/.*|$)/)
  if (m) return { limba: 'en', rest: m[1] || '/' }
  return { limba: LIMBA_IMPLICITA, rest: cale }
}

function cuPrefix(limba: Limba, cale: string): string {
  return limba === LIMBA_IMPLICITA ? cale : `/en${cale === '/' ? '' : cale}`
}

interface RuteNoi {
  toate: string[]                 // căi ro, fără prefix
  camere: string[]                // slug-uri de cameră existente
  oferte: string[]
  are: (cale: string) => boolean
}

function mapeaza(
  cale: string,
  rute: RuteNoi,
  limbiActive: Limba[],
  clicks?: number,
): Rand {
  const { limba, rest } = faraPrefixLimba(cale)
  const fel = felul(rest)

  // O limbă care nu există pe site-ul nou nu poate primi destinație validă.
  if (limba === 'en' && !limbiActive.includes('en')) {
    return { vechi: cale, limba, fel, sigur: false, clicks,
      motiv: 'Pagină în engleză, dar site-ul nou nu are engleză activă — decide: pornești modulul EN sau redirect spre echivalentul RO.' }
  }

  const dest = (nouRo: string, sigur: boolean, motiv: string): Rand =>
    ({ vechi: cale, limba, fel, nou: cuPrefix(limba, nouRo), sigur, motiv, clicks })

  switch (fel) {
    case 'home':
      return dest('/', true, 'Prima pagină → prima pagină.')

    case 'contact':
      return rute.are('/contact')
        ? dest('/contact', true, 'Pagina de contact are echivalent direct.')
        : { vechi: cale, limba, fel, sigur: false, clicks, motiv: 'Nu există /contact în noul site.' }

    case 'rooms': {
      const seg = slug(ultimulSegment(rest))
      // Cale de listă (/camere) sau segment care e chiar „camere/rooms".
      if (!seg || /^(camere|rooms|cazare|accommodation)$/.test(seg)) {
        return rute.are('/camere')
          ? dest('/camere', true, 'Lista de camere → /camere.')
          : { vechi: cale, limba, fel, sigur: false, clicks, motiv: 'Nu există listă de camere în noul site.' }
      }
      // Pagină de cameră specifică: caută cel mai apropiat slug nou.
      let best = ''; let scor = 0
      for (const s of rute.camere) {
        const n = s === seg ? 99 : suprapunere(seg, s)
        if (n > scor) { scor = n; best = s }
      }
      if (best && scor > 0) {
        const sigur = scor >= 2 || best === seg
        return dest(`/camere/${best}`, sigur,
          sigur ? `„${seg}" → camera „${best}".`
                : `Potrivire slabă („${seg}" ~ „${best}") — confirmă manual.`)
      }
      // Cameră veche fără corespondent: spre listă, NU spre „/". Marcat.
      return rute.are('/camere')
        ? { ...dest('/camere', false, `Camera „${seg}" n-are echivalent — propus spre lista /camere (verifică).`) }
        : { vechi: cale, limba, fel, sigur: false, clicks, motiv: `Camera „${seg}" n-are unde merge — decide manual.` }
    }

    case 'offers': {
      const seg = slug(ultimulSegment(rest))
      if (!seg || /^(oferte|offers|pachete|packages|promo)$/.test(seg)) {
        return rute.are('/oferte')
          ? dest('/oferte', true, 'Lista de oferte → /oferte.')
          : { vechi: cale, limba, fel, sigur: false, clicks, motiv: 'Site-ul nou n-are oferte (secțiune oprită) — decide: pornești modulul sau redirect spre /.' }
      }
      let best = ''; let scor = 0
      for (const s of rute.oferte) {
        const n = s === seg ? 99 : suprapunere(seg, s)
        if (n > scor) { scor = n; best = s }
      }
      if (best && scor > 0) {
        const sigur = scor >= 2 || best === seg
        return dest(`/oferte/${best}`, sigur,
          sigur ? `„${seg}" → oferta „${best}".` : `Potrivire slabă — confirmă manual.`)
      }
      return rute.are('/oferte')
        ? { ...dest('/oferte', false, `Oferta „${seg}" n-are echivalent — propus spre /oferte (verifică).`) }
        : { vechi: cale, limba, fel, sigur: false, clicks, motiv: `Oferta „${seg}" n-are unde merge — decide manual.` }
    }

    case 'dining':
      return rute.are('/facilitati/restaurant')
        ? dest('/facilitati/restaurant', true, 'Restaurant → /facilitati/restaurant.')
        : { vechi: cale, limba, fel, sigur: false, clicks, motiv: 'Site-ul nou n-are pagină de restaurant (modul oprit) — decide manual.' }

    case 'events':
      return rute.are('/evenimente')
        ? dest('/evenimente', true, 'Evenimente → /evenimente.')
        : { vechi: cale, limba, fel, sigur: false, clicks, motiv: 'Site-ul nou n-are pagină de evenimente (modul oprit) — decide manual.' }

    case 'gallery':
      return rute.are('/galerie')
        ? dest('/galerie', true, 'Galerie → /galerie.')
        : { vechi: cale, limba, fel, sigur: false, clicks, motiv: 'Fără galerie extinsă în noul site — mută spre prima pagină doar dacă nu avea conținut propriu.' }

    case 'spa':
      // Nu avem pagină de spa dedicată; e o secțiune pe prima pagină.
      return { vechi: cale, limba, fel, sigur: false, clicks,
        motiv: 'Spa/wellness e secțiune pe prima pagină, nu pagină proprie — decide: /#… sau /.' }

    case 'legal':
      // Paginile legale au echivalente, dar slug-urile diferă — de mapat cu mâna.
      return { vechi: cale, limba, fel, sigur: false, clicks,
        motiv: 'Pagină legală — mapeaz-o la echivalentul din /politica-* (slug-urile diferă).' }

    case 'about':
      return { vechi: cale, limba, fel, sigur: false, clicks,
        motiv: 'Pagina „despre" e de obicei absorbită în prima pagină — dacă aducea trafic, decide o țintă; altfel /.' }

    default:
      return { vechi: cale, limba, fel, sigur: false, clicks,
        motiv: 'Fără echivalent evident — decizie manuală (NU spre „/" dacă avea conținut propriu).' }
  }
}

/* ------------------------------------------------------------------ */
/* Rutele noi din client                                              */
/* ------------------------------------------------------------------ */

function ruteNoiDinClient(slugClient: string | undefined): { rute: RuteNoi; limbi: Limba[]; nume: string } {
  // Fără client: setul minim garantat de motor. Maparea rămâne conservatoare.
  const fallback: RuteNoi = {
    toate: ['/', '/camere', '/oferte', '/contact'],
    camere: [], oferte: [],
    are(c) { return this.toate.includes(c) },
  }
  if (!slugClient) return { rute: fallback, limbi: [LIMBA_IMPLICITA], nume: '' }

  try {
    const { date, setari } = incarcaClient(slugClient)
    const rute = ruteleSitului(date, setari)
    const toate = rute.map((r) => r.cale)
    const camere = date.rooms.items.map((c) => c.slug)
    const oferte = date.offers.items.map((o) => o.slug)
    const limbi: Limba[] = setari.module.engleza ? [LIMBA_IMPLICITA, 'en'] : [LIMBA_IMPLICITA]
    return {
      rute: { toate, camere, oferte, are: (c) => toate.includes(c) },
      limbi,
      nume: date.brand?.name || slugClient,
    }
  } catch (e) {
    console.warn(`  (nu am putut încărca clientul „${slugClient}": ${e instanceof Error ? e.message.split('\n')[0] : e})`)
    console.warn('  Continui cu setul minim de rute — maparea va cere mai multe decizii manuale.\n')
    return { rute: fallback, limbi: [LIMBA_IMPLICITA], nume: slugClient }
  }
}

/* ------------------------------------------------------------------ */

function scrieRedirecturi(dir: string, randuri: Rand[]) {
  const cu = randuri.filter((r) => r.nou)
  const linii = cu.map((r) =>
    `  { source: ${JSON.stringify(r.vechi)}, destination: ${JSON.stringify(r.nou!)}, permanent: true },` +
    (r.sigur ? '' : '  // TODO verifică: ' + r.motiv))
  const cap = [
    '/**',
    ' * Redirect-uri 301 de pe site-ul vechi — generat de `npm run migrare` (T33).',
    ' *',
    ' * Cum se folosește, în next.config.ts:',
    ' *   import { redirecturi } from \'../redirecturi\'',
    ' *   const config: NextConfig = { …, async redirects() { return redirecturi } }',
    ' *',
    ' * Rândurile cu „TODO verifică" sunt propuneri cu potrivire slabă sau fără',
    ' * echivalent direct: confirmă-le sau corectează destinația înainte de lansare.',
    ' * NICIUN redirect nu duce în bloc spre „/" (ar fi soft 404 pentru Google).',
    ' */',
    '',
    '// Forma acceptată de `redirects()` din next.config — tipată local, ca',
    '// fișierul să nu depindă de căi interne din Next.',
    'export interface Redirect301 { source: string; destination: string; permanent: true }',
    '',
    'export const redirecturi: Redirect301[] = [',
  ]
  writeFileSync(path.join(dir, 'redirecturi.ts'), cap.join('\n') + '\n' + linii.join('\n') + '\n]\n')
}

function scrieRaport(dir: string, nume: string, urlVechi: string, randuri: Rand[], surse: string[]) {
  const auto = randuri.filter((r) => r.sigur && r.nou)
  const manual = randuri.filter((r) => !r.sigur)
  const cuTrafic = randuri.filter((r) => r.clicks != null).sort((a, b) => (b.clicks! - a.clicks!)).slice(0, 20)

  const L: string[] = []
  L.push(`# Migrare SEO${nume ? ` — ${nume}` : ''}`)
  L.push('')
  L.push(`Site vechi: ${urlVechi}`)
  L.push(`Generat: ${new Date().toISOString().slice(0, 10)} · ${randuri.length} URL-uri vechi`)
  L.push(`Surse inventar: ${surse.join(', ')}`)
  L.push('')
  L.push('> Scopul: zero poziții pierdute în Google la înlocuirea site-ului. Fiecare URL')
  L.push('> vechi trebuie să dea 301 către o pagină nouă care răspunde 200. Niciun redirect')
  L.push('> în bloc spre prima pagină — Google îl tratează ca soft 404.')
  L.push('')
  L.push(`## 1 · Mapări automate (${auto.length}) — potrivire clară`)
  L.push('')
  if (!auto.length) L.push('_Niciuna — verifică dacă ai dat `--client <slug>`, altfel rutele noi nu sunt cunoscute._')
  else {
    L.push('| URL vechi | → | Pagina nouă |')
    L.push('|---|---|---|')
    for (const r of auto) L.push(`| \`${r.vechi}\` | → | \`${r.nou}\` |`)
  }
  L.push('')
  L.push(`## 2 · De decis manual (${manual.length}) — NU sunt ghicite`)
  L.push('')
  if (!manual.length) L.push('_Nimic de decis — toate URL-urile au echivalent clar._')
  else {
    L.push('| URL vechi | Fel | Propunere | De ce e nesigur |')
    L.push('|---|---|---|---|')
    for (const r of manual) L.push(`| \`${r.vechi}\` | ${r.fel} | ${r.nou ? `\`${r.nou}\`` : '—'} | ${r.motiv} |`)
  }
  L.push('')
  if (cuTrafic.length) {
    L.push('## 3 · Paginile care aduceau trafic (din Search Console)')
    L.push('')
    L.push('Tratează-le cu grijă: textul care rankează se **păstrează** (curățat), nu se rescrie orb.')
    L.push('')
    L.push('| Clicuri | URL vechi | → | Nou |')
    L.push('|---|---|---|---|')
    for (const r of cuTrafic) L.push(`| ${r.clicks} | \`${r.vechi}\` | → | ${r.nou ? `\`${r.nou}\`` : '**de decis**'} |`)
    L.push('')
  }
  L.push('## 4 · Checklist per client (T33)')
  L.push('')
  for (const c of [
    'Inventar complet al URL-urilor vechi — înainte de lansare (fișierul ăsta)',
    'Redirect 301 de la fiecare URL vechi → echivalent (vezi `redirecturi.ts`)',
    'Zero redirect în bloc spre prima pagină',
    'Textele care aduc trafic, păstrate',
    '`sitemap.xml` trimis în Search Console în ziua lansării',
    'Google Business Profile actualizat cu noul URL',
    'Monitorizare 404 pornită (4–6 săptămâni)',
    'Linkurile vechi din Booking.com / Facebook / Google Maps verificate manual',
    'NAP identic pe site, în Google Business Profile și pe Booking.com',
  ]) L.push(`- [ ] ${c}`)
  L.push('')
  L.push('## 5 · Verificarea 301 după deploy')
  L.push('')
  L.push('```bash')
  L.push('while read url; do')
  L.push('  echo -n "$url → "')
  L.push('  curl -s -o /dev/null -w "%{http_code} %{redirect_url}\\n" "$url"')
  L.push('done < urluri-vechi.txt')
  L.push('```')
  L.push('')
  L.push('Zero 404. Zero redirect spre `/` pentru pagini care aveau conținut propriu.')
  L.push('')
  writeFileSync(path.join(dir, 'MIGRARE.md'), L.join('\n'))
}

/* ------------------------------------------------------------------ */

async function main() {
  const target = process.argv[2]
  if (!target || target.startsWith('-')) {
    console.error('\n  Utilizare: npm run migrare -- https://site-vechi.ro [--client <slug>] [--gsc export.csv]\n')
    process.exit(1)
  }
  let root: URL
  try { root = new URL(target) } catch {
    console.error(`\n  „${target}" nu e o adresă validă. Pune adresa completă, cu https://\n`)
    process.exit(1)
  }

  const slugClient = arg('--client')
  const gsc = arg('--gsc')
  const { rute, limbi, nume } = ruteNoiDinClient(slugClient)

  console.log(`\n  Inventariez ${root.href}`)

  /* ------------------------------------------------ inventar (3 surse) */
  const surse: string[] = []
  const brut = new Map<string, { clicks?: number }>()

  const sm = await dinSitemap(root, 400)
  if (sm.length) { surse.push(`sitemap (${sm.length})`); for (const u of sm) brut.set(u, {}) }

  const home = await dinPaginaPrincipala(root, 300)
  if (home.length) { surse.push(`linkuri interne (${home.length})`); for (const u of home) if (!brut.has(u)) brut.set(u, {}) }

  if (gsc) {
    if (!existsSync(gsc)) { console.error(`\n  Nu găsesc fișierul GSC „${gsc}".\n`); process.exit(1) }
    const rows = dinGsc(gsc)
    surse.push(`Search Console (${rows.length})`)
    for (const r of rows) brut.set(r.url, { clicks: r.clicks })
  }

  if (!brut.size) {
    console.error('\n  N-am găsit niciun URL vechi (fără sitemap, fără linkuri, fără --gsc).')
    console.error('  Site-ul e picat, blochează accesul automat, sau e randat integral din JS.\n')
    process.exit(1)
  }

  /* ------------------------------------------------ normalizare + dedupe pe cale */
  const peCale = new Map<string, { clicks?: number }>()
  for (const [u, meta] of brut) {
    if (!sameHost(u, root.href)) continue
    if (ASSET.test(u)) continue
    const cale = caleDinUrl(u)
    if (cale == null) continue
    const prev = peCale.get(cale)
    peCale.set(cale, { clicks: meta.clicks ?? prev?.clicks })
  }
  console.log(`  ${peCale.size} pagini vechi unice`)

  /* ------------------------------------------------ mapare */
  const randuri = [...peCale.entries()]
    .map(([cale, meta]) => mapeaza(cale, rute, limbi, meta.clicks))
    .sort((a, b) => (a.sigur === b.sigur ? a.vechi.localeCompare(b.vechi) : a.sigur ? -1 : 1))

  const auto = randuri.filter((r) => r.sigur).length
  const manual = randuri.length - auto

  /* ------------------------------------------------ scrie */
  const dir = slugClient ? path.join(CLIENTI, slugClient) : process.cwd()
  scrieRedirecturi(dir, randuri)
  scrieRaport(dir, nume, root.href, randuri, surse)
  writeFileSync(path.join(dir, 'urluri-vechi.txt'),
    randuri.map((r) => new URL(r.vechi, root.origin).href).join('\n') + '\n')

  const rel = slugClient ? `clienti/${slugClient}` : '.'
  console.log('\n  ─────────────────────────────────────────────')
  console.log(`  ${auto} mapate automat · ${manual} de decis manual`)
  if (!slugClient) console.log('  (fără --client rutele noi nu-s cunoscute → multe decizii manuale)')
  console.log(`\n  Scrise în ${rel}/:`)
  console.log('    MIGRARE.md · redirecturi.ts · urluri-vechi.txt')
  console.log(`\n  Citește:  cat ${rel}/MIGRARE.md`)
  console.log(`  Apoi pune redirect-urile în next.config.ts (instrucțiuni în redirecturi.ts).\n`)
}

main().catch((err) => {
  console.error('\n  Migrarea a eșuat:', err instanceof Error ? err.message : err, '\n')
  process.exit(1)
})

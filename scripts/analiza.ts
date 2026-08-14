/**
 * npm run analiza -- https://site-resort-real.ro [--nume "Nume"] [--client slug]
 *
 * Citește site-ul actual al unei locații și scrie, în `clienti/<slug>/`:
 *   PROPUNERE.md      – documentul de decizie (6 secțiuni)
 *   date/*.md         – formatul editabil din T05, pre-completat
 *   poze/*.webp       – fotografiile lor, descărcate și re-encodate
 *
 * Nu trimite nimic nicăieri, nu atinge site-ul lor, nu scrie cod de site
 * și — regula 3 din REGULI.md — nu inventează nimic. Un câmp negăsit
 * rămâne un comentariu în fișier care spune ce lipsește.
 *
 * Sursă: `Fiald/hotel-forge/scripts/ingest.ts`, cu ieșirea schimbată din
 * `content/site.json` în fișiere `.md` (DECIZII.md).
 */
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { runAudit } from './lib/audit'
import {
  collectCss, crawl, extractContact, extractFaq, extractHeroImage, extractLogo,
  extractOffers, extractReviews, extractRooms, readJsonLd,
} from './lib/extract'
import { pickTypography } from './lib/fonts'
import { ImageStore } from './lib/images'
import { fetchBinary, fetchPage } from './lib/net'
import { buildPalette, colorsFromCss, colorsFromImage, readCharacter } from './lib/palette'
import { detecteazaMotor, recomandaSablon, scriePropunere } from './lib/propunere'
import { scrieDate, type Extras } from './lib/scrie-md'

const MOTOR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const CLIENTI = path.join(MOTOR, '..', 'clienti')

const goluri: string[] = []
const gol = (m: string) => goluri.push(m)

function arg(flag: string): string | undefined {
  const i = process.argv.indexOf(flag)
  return i > -1 ? process.argv[i + 1] : undefined
}

const slug = (s: string) =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[șş]/gi, 's').replace(/[țţ]/gi, 't')
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60)

async function main() {
  const target = process.argv[2]
  if (!target || target.startsWith('-')) {
    console.error('\n  Utilizare: npm run analiza -- https://site-resort.ro [--nume "Nume"] [--client slug]\n')
    process.exit(1)
  }

  let url: string
  try {
    url = new URL(target).href
  } catch {
    console.error(`\n  „${target}" nu e o adresă validă. Pune adresa completă, cu https://\n`)
    process.exit(1)
  }

  console.log(`\n  Analizez ${url}\n`)

  /* --------------------------------------------------------- crawl + audit */

  let home
  try {
    home = await fetchPage(url)
  } catch (err) {
    console.error(`\n  Nu am putut deschide site-ul: ${err instanceof Error ? err.message : err}`)
    console.error('  Verifică adresa, sau site-ul e picat / blochează accesul automat.\n')
    process.exit(1)
  }
  if (home.status === 403 || home.status === 401) {
    console.error(`\n  Site-ul a răspuns ${home.status} — blochează accesul automat (probabil un firewall / anti-bot).`)
    console.error('  Nu pot analiza automat. Completează manual scheletul de client.\n')
    process.exit(1)
  }
  if (home.status >= 400) {
    console.error(`\n  Site-ul a răspuns ${home.status}. Nu pot continua.\n`)
    process.exit(1)
  }

  const pages = await crawl(url)
  if (pages.length === 0) {
    console.error('\n  Nu am putut citi nicio pagină. Site-ul pare generat integral din JavaScript,')
    console.error('  sau robots.txt blochează totul. Nu pot extrage conținut — completează manual.\n')
    process.exit(1)
  }
  console.log(`  ${pages.length} pagini citite`)
  const homePage = pages.find((p) => p.kind === 'home') ?? pages[0]

  // Un semnal că pagina e goală fără JS: aproape niciun text în body.
  if (homePage.$('body').text().replace(/\s+/g, '').length < 400) {
    gol('Pagina principală are foarte puțin text în HTML — site-ul lor pare randat din JavaScript. Multe câmpuri vor fi goale; completează-le manual.')
  }

  const audit = await runAudit({ url: home.url, html: home.body, headers: home.headers, bytes: home.bytes })
  console.log(`  ${audit.findings.length} constatări în audit`)

  /* ------------------------------------------------------------- identitate */

  const ld = readJsonLd(homePage.$)
  const numeArg = arg('--nume')
  const numeDedus = !numeArg && !ld.name
  const nume =
    numeArg ??
    ld.name ??
    homePage.$('meta[property="og:site_name"]').attr('content') ??
    (homePage.$('title').text().split(/[|–—-]/)[0].trim() || 'Locație')
  const numeScurt = nume.split(/\s+/).slice(0, 2).join(' ')
  if (numeDedus) gol('Numele a fost dedus din titlul paginii — confirmă-l în `date/01-nume-logo-si-descriere.md`.')

  const contact = extractContact(pages, ld)
  if (!contact.phone) gol('Nu am găsit un telefon — completează `date/02-telefon-email-si-adresa.md`.')
  if (!contact.email) gol('Nu am găsit un email — completează `date/02-telefon-email-si-adresa.md`.')
  if (!contact.street) gol('Adresa nu era în datele structurate — completează `date/02-telefon-email-si-adresa.md`.')

  /* ------------------------------------------------------------------ temă */

  const css = await collectCss(homePage, url)
  const logoUrl = extractLogo(pages, url)
  const logoColors = logoUrl
    ? await (async () => {
        const buf = await fetchBinary(logoUrl)
        return buf ? colorsFromImage(buf) : new Map<string, number>()
      })()
    : new Map<string, number>()
  const paleta = buildPalette(colorsFromCss(css), logoColors)
  const caracter = readCharacter(css, home.body)
  const fonturi = pickTypography(caracter)
  console.log(`  paletă: brand ${paleta.brand}, accent ${paleta.accent} · caracter: ${caracter}`)

  /* -------------------------------------------------------- decide slug + dir */

  const clientSlug = arg('--client') ?? (slug(numeScurt) || 'client')
  const dir = path.join(CLIENTI, clientSlug)
  await mkdir(path.join(dir, 'date'), { recursive: true })
  await mkdir(path.join(dir, 'poze'), { recursive: true })

  /* ---------------------------------------------------------------- imagini */

  const store = new ImageStore(path.join(dir, 'poze'))
  await store.init()

  let logoStored: string | undefined
  const heroSource = extractHeroImage(pages, url)
  if (heroSource) await store.store(heroSource, 'hero', `${slug(numeScurt)}-hero`)
  else gol('Nu am putut prelua o imagine de hero — pune una în `poze/` și în `date/03-pagina-principala.md`.')

  if (logoUrl) {
    const l = await store.store(logoUrl, 'logo', `${slug(numeScurt)}-logo`)
    logoStored = l ? path.basename(l.src) : undefined
  }

  const rawCamere = extractRooms(pages, url)
  const camere = await Promise.all(
    rawCamere.map(async (r) => {
      const img = r.sourceImages[0] ? await store.store(r.sourceImages[0], 'card', r.slug) : null
      const { sourceImages, ...rest } = r
      return { ...rest, image: img?.src ?? '' }
    }),
  )
  if (!camere.length) gol('Nu am identificat camere — completează `date/04-camere.md` manual.')
  else if (camere.every((c) => c.priceFrom == null)) gol('Niciuna dintre camere nu avea preț pe site — completează `Preț de la` în `date/04-camere.md`.')

  const rawOferte = extractOffers(pages, url)
  const oferte = await Promise.all(
    rawOferte.map(async (o) => {
      const img = o.sourceImage ? await store.store(o.sourceImage, 'card', o.slug) : null
      const { sourceImage, ...rest } = o
      return { ...rest, image: img?.src ?? '' }
    }),
  )

  console.log(`  ${store.count} imagini descărcate și re-encodate WebP`)

  /* --------------------------------------------------------------- conținut */

  const faq = extractFaq(pages)
  if (!faq.length) gol('Nu am găsit întrebări frecvente — adaugă-le în `date/09-intrebari-frecvente.md` (contează pentru FAQPage schema).')

  const recenzii = extractReviews(pages)
  if (recenzii.length) gol('Recenziile preluate NU au autor și sursă — completează-le sau șterge-le, altfel nu se afișează (REGULI.md 3).')
  else gol('Nu am găsit recenzii cu sursă — nu inventez. Adaugă citate reale în `date/08-recenzii.md`.')

  gol('Textele de campanie (`date/03-pagina-principala.md`: titlu hero, subtitlu, secțiune de închidere) sunt goale intenționat — sunt singurele care nu se extrag și trebuie scrise.')

  const rezervari = detecteazaMotor(pages)

  const extras: Extras = {
    nume,
    numeScurt,
    numeDedus,
    slogan: undefined,
    descriere: homePage.$('meta[name="description"]').attr('content')?.trim() || undefined,
    stele: ld.stars,
    tip: undefined,
    logo: logoStored,
    telefon: contact.phone || undefined,
    email: contact.email || undefined,
    strada: contact.street || undefined,
    oras: contact.city || undefined,
    judet: contact.region,
    codPostal: contact.postalCode,
    tara: contact.country || undefined,
    lat: contact.lat,
    lng: contact.lng,
    mapsUrl: contact.mapsUrl,
    social: contact.social.map((s) => ({ label: s.label, url: s.url })),
    camere,
    oferte,
    recenzii,
    faq,
    paleta,
    fonturi,
    rotunjire: caracter === 'contemporary' ? '10px' : '14px',
    caracter,
    rezervari: { tip: rezervari.tip, sistem: rezervari.sistem, adresa: rezervari.adresa },
  }

  /* ------------------------------------------------------------------ scrie */

  const sablon = recomandaSablon(extras, pages, store.count)
  const scrise = await scrieDate(dir, extras)
  const propunere = scriePropunere(extras, audit, sablon, pages, goluri, store.count)
  await writeFile(path.join(dir, 'PROPUNERE.md'), propunere)

  /* ----------------------------------------------------------------- raport */

  const numeSablon = {
    1: 'Hero Video',
    2: 'Poveste alternantă',
    3: 'Galerie editorială',
    4: 'Carusel editorial',
  } as const
  console.log('\n  ─────────────────────────────────────────────')
  console.log(`  Șablon recomandat: ${sablon.sablon} · ${numeSablon[sablon.sablon]}`)
  console.log(`  Motor rezervări: ${rezervari.sistem ?? 'niciunul (formular + telefon)'}`)
  console.log(`  Scrise în clienti/${clientSlug}/:`)
  console.log(`    PROPUNERE.md · ${scrise.length} fișiere date/ · ${store.count} poze/`)
  console.log(`\n  Citește:  cat clienti/${clientSlug}/PROPUNERE.md`)
  console.log(`  Apoi:     npm run client-nou -- ${clientSlug} --sablon ${sablon.sablon}\n`)
}

main().catch((err) => {
  console.error('\n  Analiza a eșuat:', err instanceof Error ? err.message : err, '\n')
  process.exit(1)
})

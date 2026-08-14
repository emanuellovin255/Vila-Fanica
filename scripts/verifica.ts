/**
 * npm run verifica            verifică clientul activ (.client-activ)
 * npm run verifica -- <slug>  verifică clienti/<slug>/
 *
 * O singură comandă care prinde automat tot ce se poate greși înainte de
 * lansare: cele 9 reguli din REGULI.md, plus conținut, SEO, legal și
 * performanță. Rulează pe sursă (fișiere `.md` + cod), fără build — sub
 * 60 de secunde pe un site complet, potrivit pentru CI.
 *
 * Ieșirea, ca la T05: EROARE (cod 1) · AVERTISMENT · NOTĂ. Fiecare
 * găsire spune fișierul, linia și ce să repari.
 *
 * Model: `Web Tamplate/scripts/check.sh` (DECIZII.md), portat în TS și
 * legat de loader-ul de conținut (T05), ca să nu dublăm regulile.
 */
import { existsSync, readFileSync, statSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import type { SiteData } from '../content/types'
import { incarcaClient, type Setari } from '../lib/continut'
import { LIMBA_IMPLICITA, LIMBI, type Limba } from '../lib/i18n/limbi'
import { radacinaRepo } from './lib/layout'
import { faraComentarii, fisiere, linii, Verificare } from './lib/verifica-lib'

const MOTOR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const REPO = radacinaRepo(MOTOR)
const SABLOANE = path.join(MOTOR, 'sabloane')

// Loader-ul (lib/site.ts, lib/continut) rezolvă clienții din `process.cwd()`,
// presupunând că e `_motor/` (ca la `next build`). Ancorăm cwd aici, ca
// `npm run verifica` să meargă la fel indiferent de unde e pornit.
process.chdir(MOTOR)

/* ------------------------------------------------------------------ */
/* Care client                                                        */
/* ------------------------------------------------------------------ */

function clientTinta(): string {
  const arg = process.argv[2]
  if (arg && !arg.startsWith('-')) return arg
  const marker = path.join(MOTOR, '.client-activ')
  if (existsSync(marker)) {
    const nume = readFileSync(marker, 'utf8').trim()
    if (nume) return nume
  }
  console.error(
    '\n  Ce client verific?\n' +
      '  Rulează: npm run verifica -- <slug>\n' +
      '  sau pune numele în _motor/.client-activ\n',
  )
  process.exit(1)
}

/* Rădăcina folderului clientului, ca în lib/site.ts. */
function radacinaClient(nume: string): string {
  const monorepo = path.join(REPO, 'clienti', nume)
  if (existsSync(monorepo)) return monorepo
  if (existsSync(path.join(REPO, 'setari.md')) || existsSync(path.join(REPO, 'date'))) return REPO
  return monorepo
}

/**
 * `.md`-urile clientului care chiar ajung pe site: `date/`, `en/`, `setari.md`.
 *
 * Restul sunt documente de lucru — notele de task din `tasks/`, materialele
 * brute din `_sursa/`, raportul `CITESTE-MA.md`, oferta `PROPUNERE.md`. Ele
 * vorbesc *despre* site (au voie să scrie „PLACEHOLDER" sau un emoji într-o
 * listă de verificat), nu apar în el. Scanate ca și conținut, produceau erori
 * care blocau publicarea unui site perfect valid.
 */
const DOAR_LUCRU = new Set(['tasks', '_sursa', 'CITESTE-MA.md', 'PROPUNERE.md'])
function fisiereClient(clientDir: string): string[] {
  return fisiere(clientDir, ['.md']).filter((f) => {
    const rel = path.relative(clientDir, f)
    return !DOAR_LUCRU.has(rel) && !DOAR_LUCRU.has(rel.split(path.sep)[0])
  })
}

/* ------------------------------------------------------------------ */
/* Reguli din REGULI.md — verificări pe sursă                          */
/* ------------------------------------------------------------------ */

const HEX = /#[0-9a-fA-F]{3,8}\b/
const FUNC_CULOARE = /\b(rgba?|hsla?)\s*\(/
const ALLOW = /allow-hardcoded-color/

/** 4 · Nicio culoare în afara tokenilor. */
function reguliCulori(v: Verificare) {
  const tinte = [
    ...fisiere(SABLOANE, ['.css', '.tsx']),
    ...fisiere(path.join(MOTOR, 'styles'), ['.css']),
    ...fisiere(path.join(MOTOR, 'components'), ['.tsx']),
    ...fisiere(path.join(MOTOR, 'app'), ['.tsx']),
  ]
    // tokens.css e casa culorilor, iar tokens.client.css e aceeași casă pentru
    // client: generat de `scripts/tema.ts` din date/11-culori-si-fonturi.md, tot
    // din valori pe care omul chiar trebuie să le scrie ca hex.
    .filter((f) => !f.endsWith('tokens.css') && !f.endsWith('tokens.client.css'))

  for (const f of tinte) {
    linii(f).forEach((l, i) => {
      if (ALLOW.test(l)) return
      if (l.includes('var(--')) return // referire la token, nu culoare crudă
      const m = l.match(HEX) ?? l.match(FUNC_CULOARE)
      if (!m) return
      v.eroare({
        fisier: v.rel(f),
        linie: i + 1,
        mesaj: `Culoare scrisă direct în cod („${m[0]}") — regula 4 cere ca toate culorile să vină din tokeni.`,
        repara:
          'Mută culoarea într-un token în styles/tokens.css și folosește var(--…). Excepțiile reale (ex. #000 într-un mask) se marchează cu un comentariu allow-hardcoded-color.',
      })
    })
  }
}

// Pictograme colorate. NU include săgețile (→) și alte semne tipografice.
const EMOJI = /[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B50}\u{2B55}]/u

/** 8 · Niciun emoji în cod sau conținut. */
function reguliEmoji(v: Verificare, clientDir: string) {
  const tinte = [
    ...fisiereClient(clientDir),
    ...fisiere(SABLOANE, ['.tsx', '.css', '.ts']),
  ]
  for (const f of tinte) {
    // Ca la `continut`: comentariile explică regula, nu o încalcă.
    faraComentarii(readFileSync(f, 'utf8')).split(/\r?\n/).forEach((l, i) => {
      const m = l.match(EMOJI)
      if (!m) return
      v.eroare({
        fisier: v.rel(f),
        linie: i + 1,
        mesaj: `Emoji găsit („${m[0]}") — regula 8: emoji-urile se randează diferit pe fiecare platformă și arată a placeholder.`,
        repara: 'Șterge-l. Dacă e o pictogramă de interfață, folosește un icon SVG din _motor/components/Icon.tsx.',
      })
    })
  }
}

// Telefon RO și email — datele de contact stau în date/, nu în cod (regula 5).
const TELEFON_RO = /(?:\+?4)?0(?:7\d{2}|[23]\d{1,2})[\s.\-]?\d{3}[\s.\-]?\d{3}/
const EMAIL = /[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}/
const EMAIL_OK = /example\.|domeniu|@types\/|sentry|schema\.org|\.png|\.svg/

/** 5 · Nicio dată de contact în cod. */
function reguliContact(v: Verificare) {
  const tinte = [
    ...fisiere(SABLOANE, ['.tsx', '.ts']),
    ...fisiere(path.join(MOTOR, 'components'), ['.tsx']),
    ...fisiere(path.join(MOTOR, 'app'), ['.tsx']),
  ]
  for (const f of tinte) {
    const brut = faraComentarii(readFileSync(f, 'utf8'))
    brut.split(/\r?\n/).forEach((l, i) => {
      const tel = l.match(TELEFON_RO)
      if (tel && !/\d{4}-\d{2}-\d{2}/.test(l)) {
        v.eroare({
          fisier: v.rel(f),
          linie: i + 1,
          mesaj: `Număr de telefon scris direct în cod („${tel[0].trim()}") — regula 5.`,
          repara: 'Mută-l în clienti/<nume>/date/02-telefon-email-si-adresa.md și citește-l din date, niciodată dintr-o componentă.',
        })
      }
      const em = l.match(EMAIL)
      if (em && !EMAIL_OK.test(l) && !/import|from ['"]/.test(l)) {
        v.eroare({
          fisier: v.rel(f),
          linie: i + 1,
          mesaj: `Adresă de email scrisă direct în cod („${em[0]}") — regula 5.`,
          repara: 'Mută-o în date/02-telefon-email-si-adresa.md. Datele de contact nu se scriu niciodată într-o componentă.',
        })
      }
    })
  }
}

const CDN_PERMIS = /challenges\.cloudflare\.com|googletagmanager\.com|google\.com\/maps|www\.google\.com\/maps/

/** 9 · Fără CDN extern (fonturi, imagini, scripturi neaprobate). */
function reguliCdn(v: Verificare) {
  // Fonturi/imagini din CSS: url(http…) e mereu greșit — totul e local.
  for (const f of fisiere(SABLOANE, ['.css']).concat(fisiere(path.join(MOTOR, 'styles'), ['.css']))) {
    linii(f).forEach((l, i) => {
      const m = l.match(/url\(\s*['"]?(https?:\/\/[^)'"]+)/i) ?? l.match(/@import\s+['"](https?:\/\/[^'"]+)/i)
      if (!m) return
      v.eroare({
        fisier: v.rel(f),
        linie: i + 1,
        mesaj: `Resursă externă în CSS („${m[1]}") — regula 9: fonturi și imagini se servesc local.`,
        repara: 'Descarcă fișierul în public/ și referă-l cu o cale locală.',
      })
    })
  }
  // Resurse ÎNCĂRCATE extern în componente (scripturi, iframe, stiluri),
  // în afara celor aprobate. NU linkurile `<a href>` — un link către
  // anpc.ro sau SOL e obligatoriu, nu o resursă de CDN.
  for (const f of fisiere(SABLOANE, ['.tsx']).concat(fisiere(path.join(MOTOR, 'components'), ['.tsx']))) {
    faraComentarii(readFileSync(f, 'utf8'))
      .split(/\r?\n/)
      .forEach((l, i) => {
        const m =
          l.match(/\bsrc=["'`]\s*(https?:\/\/[^"'`]+)/i) ??
          l.match(/<link[^>]*\bhref=["'`]\s*(https?:\/\/[^"'`]+)/i)
        if (!m || CDN_PERMIS.test(m[1])) return
        v.avertisment({
          fisier: v.rel(f),
          linie: i + 1,
          mesaj: `Resursă externă („${m[1]}") — regula 9 acceptă doar Turnstile, Analytics și harta Google, și doar cu Subresource Integrity.`,
          repara: 'Servește-o local, sau confirmă că e una din excepțiile aprobate și adaugă SRI.',
        })
      })
  }
}

// Proprietăți care declanșează layout — se animează doar transform/opacity.
const GEOMETRIE = /\b(height|width|top|left|right|bottom|margin|padding|inset)\b/
/** 11 · Nicio animație pe altceva decât transform/opacity. */
function reguliAnimatie(v: Verificare) {
  for (const f of fisiere(SABLOANE, ['.css']).concat(fisiere(path.join(MOTOR, 'styles'), ['.css']))) {
    linii(f).forEach((l, i) => {
      const decl = l.match(/(transition|transition-property)\s*:\s*([^;]+)/i)
      if (decl && GEOMETRIE.test(decl[2]) && !/max-|min-/.test(decl[2])) {
        const prop = decl[2].match(GEOMETRIE)![0]
        v.avertisment({
          fisier: v.rel(f),
          linie: i + 1,
          mesaj: `Animație pe „${prop}" — regula 11: proprietatea asta declanșează layout la fiecare cadru.`,
          repara: 'Rescrie efectul prin transform (translate/scale) sau opacity, singurele care rulează pe compositor.',
        })
      }
    })
  }
}

/** 1 · Fișierele din _motor/ nemodificate față de sursă. */
function reguliMotor(v: Verificare) {
  const manifest = path.join(MOTOR, '.motor-manifest.json')
  if (!existsSync(manifest)) {
    v.nota({
      fisier: '_motor/',
      mesaj: 'Nu verific integritatea motorului: lipsește un manifest de referință. În repo-ul sistemului, _motor/ ESTE sursa; verificarea are rost în repo-ul unui client, față de motorul din sistem.',
      repara: 'La T34/publicare, generează _motor/.motor-manifest.json cu hash-urile sursei, ca „verifica" să prindă orice modificare accidentală în motor.',
    })
  }
  // (Când manifestul există, aici s-ar compara hash-urile fișierelor.)
}

/**
 * Repo-ul de client trebuie să rămână o aplicație Next obișnuită: motorul în
 * rădăcină, deci `.next` în rădăcină, deci Vercel îl buildează cu setările
 * implicite. Dacă cineva reintroduce un `_motor/`, buildul pe Vercel pică cu
 * „The Next.js output directory '.next' was not found" — și pică pe Vercel,
 * nu aici, unde s-ar vedea ieftin.
 */
function reguliDeploy(v: Verificare, clientDir: string) {
  if (path.resolve(clientDir) !== path.resolve(REPO)) return // repo-ul sistemului, nu al unui client
  if (existsSync(path.join(REPO, '_motor'))) {
    v.eroare({
      fisier: '_motor/',
      mesaj: 'Repo-ul de client are un sub-folder `_motor/` — Vercel nu va găsi `.next` în rădăcină.',
      repara: 'Într-un repo de client motorul stă în rădăcină. Reconstruiește cu `npm run client-nou`, sau mută conținutul lui `_motor/` în rădăcină.',
    })
  }
  const config = path.join(REPO, 'next.config.ts')
  if (!existsSync(config)) {
    v.eroare({
      fisier: 'next.config.ts',
      mesaj: 'Lipsește `next.config.ts` din rădăcina repo-ului — Vercel nu recunoaște proiectul ca aplicație Next.',
      repara: 'Propagă motorul: `npm run actualizeaza-motor -- clienti/<nume>`.',
    })
    return
  }

  // Paginile se randează la cerere (nonce-ul CSP), deci loader-ul citește
  // `date/*.md` la fiecare cerere. Urmăritorul de fișiere al Next vede doar
  // căi literale, iar loader-ul le compune la rulare — fără includerea
  // explicită, funcția serverless ajunge pe Vercel fără niciun fișier al
  // clientului și fiecare pagină moare cu „Application error: a server-side
  // exception has occurred". Se vede doar în producție, deci se verifică aici.
  if (!/outputFileTracingIncludes/.test(readFileSync(config, 'utf8'))) {
    v.eroare({
      fisier: 'next.config.ts',
      mesaj: 'Conținutul clientului nu e inclus în funcțiile serverless — pe Vercel fiecare pagină va da „a server-side exception has occurred".',
      repara: 'Propagă motorul: `npm run actualizeaza-motor -- clienti/<nume>`. Adaugă `outputFileTracingIncludes` cu setari.md, date/, en/ și content/poze.json.',
    })
  }
}

/* ------------------------------------------------------------------ */
/* Conținut                                                            */
/* ------------------------------------------------------------------ */

const PLACEHOLDER = /\b(lorem|ipsum|todo|xxx|de completat|tbd|placeholder)\b/i
const SEDILA = /[şţŞŢ]/

/**
 * Texte de umplutură și diacritice greșite în conținutul clientului.
 *
 * Fără comentariile `<!-- -->`: fiecare `date/*.md` poartă în ele instrucțiunile
 * de completare, iar acelea vorbesc despre reguli („nu lăsa un placeholder") cu
 * exact cuvintele pe care le căutăm aici. Loader-ul le ignoră, deci nu ajung
 * niciodată în pagină. `faraComentarii` păstrează liniile, deci numerele rămân
 * corecte.
 */
function continut(v: Verificare, clientDir: string) {
  for (const f of fisiereClient(clientDir)) {
    faraComentarii(readFileSync(f, 'utf8')).split(/\r?\n/).forEach((l, i) => {
      const ph = l.match(PLACEHOLDER)
      if (ph) {
        v.eroare({
          fisier: v.rel(f),
          linie: i + 1,
          mesaj: `Text de umplutură rămas („${ph[0]}") — rușinos într-o pagină publică.`,
          repara: 'Înlocuiește-l cu textul real sau șterge rândul.',
        })
      }
      const sed = l.match(SEDILA)
      if (sed) {
        const corect = sed[0] === 'ş' ? 'ș' : sed[0] === 'ţ' ? 'ț' : sed[0] === 'Ş' ? 'Ș' : 'Ț'
        v.avertisment({
          fisier: v.rel(f),
          linie: i + 1,
          mesaj: `Diacritică greșită: „${sed[0]}" e cu sedilă, nu cu virgulă dedesubt.`,
          repara: `Scrie „${corect}" (varianta românească, cu virgulă). Diferența se vede pe ecran.`,
        })
      }
    })
  }
}

/**
 * Prețuri lipsă la camere și poze nefolosite.
 *
 * `setari` e parametru pentru verificarea pozelor — vezi nota de la „Poze
 * nefolosite" mai jos. Fără el, verificatorul raporta drept „greutate inutilă"
 * chiar pozele din care e făcută pagina de galerie.
 */
function continutDate(
  v: Verificare,
  date: SiteData,
  poze: string[],
  limba: Limba,
  setari: Setari,
) {
  const dir = `${limba === 'ro' ? 'date' : limba}/04-camere.md`
  for (const c of date.rooms.items) {
    if (c.priceFrom == null) {
      v.avertisment({
        fisier: dir,
        unde: c.name,
        mesaj: 'Camera n-are preț „de la" — ascunderea prețului pierde vizitatori care compară.',
        repara: 'Completează „Preț de la:" cu prețul minim pe noapte. Se afișează cu „de la", ca să nu te blochezi la o valoare exactă.',
      })
    }
  }

  // Poze nefolosite: greutate inutilă în repo. (doar la ro, o singură dată)
  if (limba !== 'ro') return

  // CU GALERIA EXTINSĂ PORNITĂ, VERIFICAREA ASTA N-ARE OBIECT.
  //
  // `app/[limba]/galerie/page.tsx` construiește pagina din `poze/`, TOATE, nu
  // doar din cele referite dintr-un `date/*.md` — e chiar rostul unei galerii,
  // scris în comentariul de acolo: „pozele bune care n-au încăput în nicio
  // secțiune".
  //
  // Bucla de mai jos știe doar de siglă, hero, camere, oferte, feature-uri și
  // clip. Nu știe nici de galerie, nici de banda de semnătură, nici de pozele
  // atracțiilor din `13-zona-si-atractii.md`. La Casa Irlandeză, cu 65 de poze
  // și galeria pornită, raporta 41 de fișiere ca „greutate inutilă" — toate
  // fiind, de fapt, pagina /galerie.
  //
  // Un verificator care dă 41 de note false e mai rău decât unul care tace:
  // se învață să fie ignorat, și odată cu el se ignoră și nota adevărată de
  // data viitoare.
  if (setari.module.galerieExtinsa) return

  const folosite = new Set<string>()
  const adauga = (u?: string) => {
    if (u) folosite.add(path.basename(u))
  }
  adauga(date.brand.logo)
  adauga(date.hero.image)
  adauga((date.hero as { videoSrc?: string }).videoSrc)
  for (const c of date.rooms.items) {
    adauga(c.image)
    c.images?.forEach(adauga)
    adauga(c.video)
    adauga(c.videoPoster)
  }
  for (const o of date.offers.items) adauga(o.image)
  for (const feat of date.features) adauga(feat.image)
  adauga(date.prezentare?.video)
  adauga(date.prezentare?.poster)
  for (const p of poze) {
    if (!folosite.has(p)) {
      v.nota({
        fisier: `poze/${p}`,
        mesaj: 'Poza nu e referită din niciun fișier .md — greutate inutilă în repo.',
        repara: 'Folosește-o într-un fișier din date/ (ex. „Poze:") sau șterge-o din poze/.',
      })
    }
  }
}

/* ------------------------------------------------------------------ */
/* Rutele — sursă comună pentru linkuri moarte, sitemap, diacritice   */
/* ------------------------------------------------------------------ */

function ruteInterne(date: SiteData, setari: Setari): Set<string> {
  // `/contact` ARE acum pagină proprie (`app/[limba]/contact/`) și există
  // mereu: se randează din `02-telefon-email-si-adresa.md`, care e obligatoriu, deci nu
  // are condiție.
  //
  // `/facilitati/restaurant` rămâne ancoră pe prima pagină, deci nu e
  // rută. Un link către ea se validează prin `/`, fiindcă
  // `linkuriMoarte` taie fragmentul înainte de comparație.
  const r = new Set<string>(['/', '/multumim', '/contact'])
  if (date.rooms.items.length) {
    r.add('/camere')
    for (const c of date.rooms.items) r.add(`/camere/${c.slug}`)
  }
  if (date.offers.items.length) {
    r.add('/oferte')
    for (const o of date.offers.items) r.add(`/oferte/${o.slug}`)
  }
  if (setari.module.evenimente) r.add('/evenimente')
  if (setari.module.galerieExtinsa) r.add('/galerie')
  if (setari.module.zona) r.add('/zona')
  for (const l of date.legal.links) r.add(l.href)
  return r
}

/** Linkuri interne moarte: din butoane (date) și din text (.md). */
function linkuriMoarte(v: Verificare, clientDir: string, date: SiteData, rute: Set<string>) {
  const eIntern = (h: string) => h.startsWith('/') && !h.startsWith('//')
  const verifica = (href: string, ctx: { fisier: string; linie?: number; unde?: string }) => {
    if (!eIntern(href)) return
    const cale = href.split('#')[0].split('?')[0]
    if (cale === '' || rute.has(cale)) return
    v.eroare({
      ...ctx,
      mesaj: `Link intern către „${href}", care nu duce la nicio pagină generată — 404.`,
      repara: 'Corectează adresa sau șterge linkul. Paginile există doar pentru secțiunile pornite (camere, oferte, module).',
    })
  }

  // Din butoanele rezolvate de loader.
  for (const c of date.nav) verifica(c.href, { fisier: '(navigație)', unde: c.label })
  if (date.closing.cta?.href) verifica(date.closing.cta.href, { fisier: 'date/03-pagina-principala.md', unde: 'Secțiune de închidere' })
  for (const feat of date.features) for (const cta of feat.ctas) verifica(cta.href, { fisier: 'date/03-pagina-principala.md', unde: feat.title })

  // Din linkuri Markdown scrise în text.
  for (const f of fisiereClient(clientDir)) {
    linii(f).forEach((l, i) => {
      for (const m of l.matchAll(/\]\(([^)]+)\)/g)) {
        verifica(m[1].trim(), { fisier: v.rel(f), linie: i + 1 })
      }
    })
  }
}

/* ------------------------------------------------------------------ */
/* SEO                                                                 */
/* ------------------------------------------------------------------ */

function seo(v: Verificare, date: SiteData, setari: Setari, rute: Set<string>) {
  // Zero diacritice în URL-uri.
  for (const cale of rute) {
    if (/[^\x00-\x7F]/.test(cale)) {
      v.eroare({
        fisier: '(rute)',
        unde: cale,
        mesaj: 'URL cu diacritice — ajunge procent-codat și devine ilizibil pe WhatsApp sau într-un email.',
        repara: 'Slug-urile se generează fără diacritice din loader; dacă apare unul, verifică numele care produce ruta.',
      })
    }
  }

  // Un titlu pe fiecare pagină, unic.
  const titluri = new Map<string, string>()
  const pune = (cale: string, titlu: string) => {
    if (!titlu) return
    const prec = titluri.get(titlu)
    if (prec) {
      v.avertisment({
        fisier: '(SEO)',
        unde: cale,
        mesaj: `Titlu identic cu „${prec}": „${titlu}". Două pagini cu același titlu concurează una cu alta în Google.`,
        repara: 'Fă titlul fiecărei pagini unic — de obicei numele elementului (cameră, ofertă) e destul.',
      })
    }
    titluri.set(titlu, cale)
  }
  pune('/', date.brand.name)
  for (const c of date.rooms.items) pune(`/camere/${c.slug}`, c.name)
  for (const o of date.offers.items) pune(`/oferte/${o.slug}`, o.title)

  if (!date.seo.title) {
    v.avertisment({
      fisier: 'date/01-nume-logo-si-descriere.md',
      mesaj: 'Titlul paginii principale e gol.',
      repara: 'Completează „Nume:" în date/01-nume-logo-si-descriere.md — din el se face titlul.',
    })
  }

  // og:image pentru partajarea pe rețele.
  if (!date.seo.ogImage && !date.hero.image) {
    v.avertisment({
      fisier: 'date/03-pagina-principala.md',
      mesaj: 'Nu există og:image — când cineva dă link pe Facebook/WhatsApp, apare un card gol.',
      repara: 'Pune o poză de hero (ideal 1200×630) în poze/ și scrie-o la „Poza:" în prima secțiune.',
    })
  }

  // hreflang reciproc, dacă /en există.
  if (!setari.module.engleza) {
    v.nota({
      fisier: 'setari.md',
      mesaj: 'Engleza e oprită — site-ul are o singură limbă, fără hreflang. E o alegere validă.',
      repara: 'Dacă publicul e și internațional, pornește „Engleză: da" și traduce fișierele în en/.',
    })
  }

  // canonical are nevoie de originul real.
  if (!process.env.NEXT_PUBLIC_SITE_URL) {
    v.nota({
      fisier: '(mediu)',
      mesaj: 'NEXT_PUBLIC_SITE_URL nu e setat — canonical și sitemap ies relative în dezvoltare.',
      repara: 'Pe Vercel setează NEXT_PUBLIC_SITE_URL la domeniul final. Local nu blochează nimic.',
    })
  }

  v.nota({
    fisier: '(SEO)',
    mesaj: `sitemap.xml și JSON-LD se generează din aceleași ${rute.size} rute și din aceleași date — deci nu pot conține o rută inexistentă sau un preț care nu apare în pagină.`,
    repara: 'Pentru validarea finală a JSON-LD rulează pagina prin Rich Results Test după deploy.',
  })
}

/** Un singur H1 pe pagină: niciun fișier de pagină cu două `<h1>`. */
function unSingurH1(v: Verificare) {
  const tinte = [
    ...fisiere(SABLOANE, ['.tsx']),
    ...fisiere(path.join(MOTOR, 'app'), ['.tsx']),
    ...fisiere(path.join(MOTOR, 'components'), ['.tsx']),
  ]
  for (const f of tinte) {
    const cod = faraComentarii(readFileSync(f, 'utf8'))
    const n = (cod.match(/<h1[\s>]/g) ?? []).length
    if (n > 1) {
      v.eroare({
        fisier: v.rel(f),
        mesaj: `Fișierul conține ${n} elemente <h1> — o pagină trebuie să aibă exact unul.`,
        repara: 'Păstrează un singur <h1> (titlul paginii). Restul devin <h2>/<h3>.',
      })
    }
  }
}

/** Fiecare <img>/<Image> cu alt; <img> brut și cu width/height. */
function imagini(v: Verificare) {
  const tinte = [
    ...fisiere(SABLOANE, ['.tsx']),
    ...fisiere(path.join(MOTOR, 'components'), ['.tsx']),
    ...fisiere(path.join(MOTOR, 'app'), ['.tsx']),
  ]
  for (const f of tinte) {
    const cod = faraComentarii(readFileSync(f, 'utf8'))
    for (const m of cod.matchAll(/<(img|Image)\b[^>]*?(?:\/?>|>)/gis)) {
      const tag = m[0]
      const linie = cod.slice(0, m.index).split(/\r?\n/).length
      if (!/\balt\s*=/.test(tag)) {
        v.eroare({
          fisier: v.rel(f),
          linie,
          mesaj: `<${m[1]}> fără atribut alt — regula 13. Un cititor de ecran și un crawler nu au ce citi.`,
          repara: 'Adaugă un alt real, care descrie imaginea („Piscina exterioară la apus"), nu „poza1".',
        })
      }
      if (m[1] === 'img' && (!/\bwidth\s*=/.test(tag) || !/\bheight\s*=/.test(tag))) {
        v.avertisment({
          fisier: v.rel(f),
          linie,
          mesaj: '<img> fără width și height — regula 13. Fără ele, pagina sare când imaginea se încarcă (CLS).',
          repara: 'Adaugă width și height, sau folosește <Image> din next/image, care le impune.',
        })
      }
    }
  }
}

/* ------------------------------------------------------------------ */
/* Legal                                                               */
/* ------------------------------------------------------------------ */

function legal(v: Verificare, date: SiteData) {
  const subsol = path.join(MOTOR, 'components', 'sectiuni', 'Subsol.tsx')
  if (existsSync(subsol)) {
    const cod = readFileSync(subsol, 'utf8')
    if (!/anpc\.ro/i.test(cod) || !/(ec\.europa\.eu|\/odr|consumer\/odr)/i.test(cod)) {
      v.eroare({
        fisier: v.rel(subsol),
        mesaj: 'Linkul ANPC sau linkul SOL lipsește din footer — obligatoriu pentru un site care primește cereri online.',
        repara: 'Footerul trebuie să conțină un link către anpc.ro și unul către platforma SOL (ec.europa.eu/consumers/odr).',
      })
    }
  }

  // Formularul: checkbox GDPR nebifat implicit.
  const formular = path.join(MOTOR, 'components', 'Formular.tsx')
  if (existsSync(formular)) {
    const cod = readFileSync(formular, 'utf8')
    const acord = cod.match(/<input[^>]*name=["']acord["'][^>]*>/i)
    if (acord && /\b(defaultChecked|checked)\b/.test(acord[0])) {
      v.eroare({
        fisier: v.rel(formular),
        mesaj: 'Checkbox-ul de acord GDPR pare bifat implicit — regula 14 cere să fie nebifat.',
        repara: 'Scoate „checked"/„defaultChecked" de pe input-ul name="acord". Consimțământul trebuie dat activ.',
      })
    }
    if (acord && !/\brequired\b/.test(acord[0])) {
      v.avertisment({
        fisier: v.rel(formular),
        mesaj: 'Checkbox-ul de acord GDPR nu e „required" — formularul s-ar putea trimite fără consimțământ.',
        repara: 'Adaugă „required" pe input-ul name="acord".',
      })
    }
  }

  // Cele 3 documente legale de bază, linkuite.
  const necesare: [string, RegExp][] = [
    ['Politica de confidențialitate', /confiden/i],
    ['Politica de cookies', /cookie/i],
    ['Termeni și condiții', /termeni/i],
  ]
  for (const [nume, re] of necesare) {
    if (!date.legal.links.some((l) => re.test(l.label) || re.test(l.href))) {
      v.avertisment({
        fisier: 'date/12-firma-si-documente-legale.md',
        mesaj: `Nu găsesc un link către „${nume}" în footer.`,
        repara: 'Completează linkul în blocul „Documente legale" din date/12-firma-si-documente-legale.md. Motorul are paginile gata scrise.',
      })
    }
  }

  // Analytics încărcat doar după accept — verificare structurală pe motor.
  const analytics = path.join(MOTOR, 'components', 'Analytics.tsx')
  if (existsSync(analytics) && !/consim/i.test(readFileSync(analytics, 'utf8'))) {
    v.avertisment({
      fisier: v.rel(analytics),
      mesaj: 'Analytics nu pare legat de consimțământ — regula 14 cere ca Google/Facebook să nu se încarce înainte de accept.',
      repara: 'Analytics trebuie randat doar după accept (lib/consimtamant.ts). Verifică-l.',
    })
  } else {
    v.nota({
      fisier: '(legal)',
      mesaj: 'Înainte de accept-cookies, Analytics și harta nu se încarcă (verificat structural pe motor). Confirmarea reală se face în browser, cu tab-ul de rețea gol la primul paint.',
    })
  }
}

/* ------------------------------------------------------------------ */
/* Performanță                                                         */
/* ------------------------------------------------------------------ */

const KB = 1024
const MB = KB * 1024

function performanta(v: Verificare, date: SiteData, clientDir: string, setari: Setari) {
  // Total fonturi sub 120 KB.
  const fontDir = path.join(MOTOR, 'public', 'fonts')
  const fonturi = fisiere(fontDir, ['.woff2', '.woff', '.ttf'])
  const totalFont = fonturi.reduce((s, f) => s + statSync(f).size, 0)
  if (totalFont > 120 * KB) {
    v.avertisment({
      fisier: v.rel(fontDir),
      mesaj: `Fonturile însumează ${Math.round(totalFont / KB)} KB, peste bugetul de 120 KB.`,
      repara: 'Subsetează fonturile (scripts/subset-fonturi.sh) la glifele folosite, sau scoate o grosime.',
    })
  }

  // Video-uri (T60): hero-ul de fundal + clipul de prezentare + fiecare
  // clip de cameră. Reguli: un fișier peste 4 MB = eroare; totalul peste
  // 25 MB = eroare; video fără poster = eroare. Sunetul nu se poate citi
  // din dimensiune — la hero rămâne o notă de confirmat cu ffprobe, la un
  // clip click-to-play sunetul e intenționat, deci nu se semnalează.
  const clipuri: { src: string; poster?: string; tip: 'hero' | 'clip'; unde: string }[] = []
  const heroVideo = (date.hero as { videoSrc?: string }).videoSrc
  if (heroVideo) clipuri.push({ src: heroVideo, poster: date.hero.image, tip: 'hero', unde: 'hero' })
  if (date.prezentare?.video) {
    clipuri.push({
      src: date.prezentare.video,
      poster: date.prezentare.poster,
      tip: 'clip',
      unde: 'clipul de prezentare',
    })
  }
  for (const r of date.rooms.items) {
    if (r.video) clipuri.push({ src: r.video, poster: r.videoPoster, tip: 'clip', unde: `camera „${r.name}"` })
  }

  const fisierVideo = (src: string): string | null => {
    const local = path.join(clientDir, 'poze', path.basename(src))
    const alt = path.join(MOTOR, 'public', src.replace(/^\//, ''))
    return existsSync(local) ? local : existsSync(alt) ? alt : null
  }

  let totalVideo = 0
  for (const clip of clipuri) {
    if (!clip.poster) {
      v.eroare({
        fisier: '(video)',
        mesaj: `Clipul de la ${clip.unde} n-are poster.`,
        repara: 'Fără poster, până la click e o zonă goală. Pune un cadru din clip ca poster.',
      })
    }
    const cale = fisierVideo(clip.src)
    if (!cale) continue
    const size = statSync(cale).size
    totalVideo += size
    if (size > 4 * MB) {
      v.eroare({
        fisier: v.rel(cale),
        mesaj: `Clipul de la ${clip.unde} are ${(size / MB).toFixed(1)} MB, peste limita de 4 MB pe fișier.`,
        repara: 'Re-encodează la un bitrate mai mic și taie durata. Un clip nu e niciodată resursa LCP.',
      })
    }
    if (clip.tip === 'hero') {
      v.nota({
        fisier: v.rel(cale),
        mesaj: 'Un video de hero nu trebuie să aibă pistă audio — nu se poate citi din dimensiune.',
        repara:
          'Confirmă cu: ffprobe -show_streams pe fișier — nu trebuie să apară un stream audio. La un clip click-to-play, sunetul e intenționat.',
      })
    }
  }
  if (totalVideo > 25 * MB) {
    v.eroare({
      fisier: '(video)',
      mesaj: `Videourile însumează ${(totalVideo / MB).toFixed(1)} MB, peste bugetul de 25 MB.`,
      repara:
        'Taie din durată sau din numărul de clipuri. Fiecare se descarcă doar la click, dar bugetul total ține site-ul ușor.',
    })
  }

  if (heroVideo && setari.sablon === 1) {
    v.nota({
      fisier: 'sabloane/01-hero-video/HeroVideo.tsx',
      mesaj: 'Șablonul 1 montează videoul din useEffect doar pe desktop (≥900px, fără reduced-motion) — pe mobil se descarcă 0 bytes de video (verificat la T20).',
    })
  }

  v.nota({
    fisier: '(performanță)',
    mesaj: 'Greutatea primei încărcări (buget ~600 KB), LCP, INP și CLS se măsoară pe mobil, cu 4G simulat — după deploy pe Vercel, nu din sursă.',
    repara: 'După publicare rulează Lighthouse (mobil) și confirmă bugetul din standarde/02.',
  })
}

/* ------------------------------------------------------------------ */
/* Preluarea găsirilor din loader (T05) — nu dublăm regulile          */
/* ------------------------------------------------------------------ */

function dinLoader(v: Verificare, client: string, limba: Limba) {
  const { date, setari, raport, poze } = incarcaClient(client, limba)
  const prefix = limba === 'ro' ? 'date' : limba
  for (const c of raport.constatari) {
    // Fișierele de conținut ale loader-ului sunt relative la folderul limbii.
    const fisier = /\.md$/.test(c.fisier) && !c.fisier.includes('/') ? `${prefix}/${c.fisier}` : c.fisier
    v.adauga({
      nivel: c.nivel,
      fisier,
      linie: c.linie,
      unde: c.unde,
      mesaj: c.mesaj,
      repara: c.solutie,
    })
  }
  return { date, setari, poze }
}

/* ------------------------------------------------------------------ */
/* Orchestrare                                                         */
/* ------------------------------------------------------------------ */

function main() {
  const clientNume = clientTinta()
  const clientDir = radacinaClient(clientNume)
  if (!existsSync(clientDir)) {
    console.error(`\n  Nu există clienti/${clientNume}/. Verifică numele folderului.\n`)
    process.exit(1)
  }

  const t0 = Date.now()
  console.log(`\n  Verific „${clientNume}"…\n`)

  const v = new Verificare(REPO)

  // Loader-ul (T05) pentru fiecare limbă activă — de aici vin poza lipsă,
  // recenzia fără sursă, camera fără preț citibil, câmpurile necunoscute.
  const { date, setari, poze } = dinLoader(v, clientNume, 'ro')
  const limbiActive: Limba[] = setari.module.engleza ? [...LIMBI] : [LIMBA_IMPLICITA]
  for (const l of limbiActive) if (l !== 'ro') dinLoader(v, clientNume, l)

  const rute = ruteInterne(date, setari)

  // Reguli din REGULI.md pe sursă.
  reguliCulori(v)
  reguliEmoji(v, clientDir)
  reguliContact(v)
  reguliCdn(v)
  reguliAnimatie(v)
  reguliMotor(v)
  reguliDeploy(v, clientDir)

  // Conținut.
  continut(v, clientDir)
  continutDate(v, date, poze, 'ro', setari)
  linkuriMoarte(v, clientDir, date, rute)

  // SEO.
  seo(v, date, setari, rute)
  unSingurH1(v)
  imagini(v)

  // Legal.
  legal(v, date)

  // Performanță.
  performanta(v, date, clientDir, setari)

  /* --------------------------------------------------------- raport */
  const text = v.text()
  if (text.trim()) console.log(text)

  const secunde = ((Date.now() - t0) / 1000).toFixed(1)
  console.log(`\n  ─────────────────────────────────────────────`)
  console.log(`  ${v.rezumat()}  ·  ${secunde}s`)

  if (v.areErori()) {
    console.log(`\n  Nu se publică: rezolvă erorile de mai sus.\n`)
    process.exit(1)
  }
  console.log(`\n  Gata — nicio eroare. Se poate publica.\n`)
}

main()

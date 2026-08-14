/**
 * npm run client-nou -- <nume> --sablon <1|2|3|4> [--forteaza]
 *
 * Produce un folder de client complet funcțional, gata de completat, care
 * se buildează din prima și nu depinde de nimic din afara lui:
 *
 *   clienti/<slug>/
 *   ├── app/ components/ lib/ content/ styles/ scripts/ public/ sabloane/
 *   ├── next.config.ts · tsconfig.json · middleware.ts   ← motorul, copiat
 *   ├── date/          din analiză, dacă a rulat; altfel scheletul
 *   ├── poze/          din analiză
 *   ├── en/            gol
 *   ├── setari.md      cu șablonul ales
 *   ├── CITESTE-MA.md  raportul de stare (ce e completat, ce lipsește)
 *   ├── package.json   dev · build · verifica · publica
 *   ├── vercel.json · .env.example · .gitignore
 *   └── PROPUNERE.md   păstrat, dacă analiza a rulat
 *
 * Motorul stă în RĂDĂCINA repo-ului, nu într-un sub-folder. Motivul e
 * Vercel: o aplicație Next într-un sub-folder cere Root Directory setat de
 * mână la fiecare proiect, altfel buildul se termină cu „The Next.js output
 * directory '.next' was not found". Aici repo-ul e o aplicație Next
 * obișnuită, deci merge pe setările implicite. Separarea motor/client rămâne
 * (regula 1): ce e motor se propagă cu `actualizeaza-motor`, care își citește
 * lista de căi chiar din motorul-sursă — vezi `caiMotor()` de acolo.
 *
 * Model: `Web Tamplate/scripts/new-client.sh`. Nu suprascrie niciodată în
 * tăcere: o a doua rulare pe un client deja construit se oprește fără
 * `--forteaza`, iar fișierele pre-completate de analiză nu se ating.
 */
import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { incarcaClient } from '../lib/continut'
import { GITIGNORE_CLIENT } from './lib/layout'
import { Raport } from '../lib/continut/raport'

const MOTOR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const RADACINA = path.resolve(MOTOR, '..')
const CLIENTI = path.join(RADACINA, 'clienti')
const SABLON = path.join(CLIENTI, '_sablon-client')

function arg(flag: string): string | undefined {
  const i = process.argv.indexOf(flag)
  return i > -1 ? process.argv[i + 1] : undefined
}

const slug = (s: string) =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[șş]/gi, 's').replace(/[țţ]/gi, 't')
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60)

/** Fișiere din `_motor/` care sunt artefacte, nu sursă — nu se copiază. */
const EXCLUS = new Set(['node_modules', '.next', '.git', 'tsconfig.tsbuildinfo'])
function filtruMotor(sursa: string): boolean {
  const baza = path.basename(sursa)
  if (EXCLUS.has(baza)) return false
  // Artefacte de conținut generate (site.json/audit.json) + media build-time.
  if (/\/content\/(site|audit|poze)\.json$/.test(sursa)) return false
  // Tema generată și manifestul de fonturi: artefacte, rescrise la fiecare
  // dev/build din datele clientului-țintă. Copiate, ar duce tema clientului
  // greșit peste el, până la primul build.
  if (/\/styles\/tokens\.client\.css$/.test(sursa)) return false
  if (/\/public\/fonts\/\.tema\.json$/.test(sursa)) return false
  if (/\/public\/media(\/|$)/.test(sursa) && !sursa.endsWith('/media')) return false
  return true
}

function copiazaMotor(dest: string, slugClient: string) {
  // Motorul devine rădăcina repo-ului. `sabloane/` vine cu el, fiind în el.
  cpSync(MOTOR, dest, { recursive: true, filter: filtruMotor })
  // Markerul trebuie doar să fie ne-gol: într-un repo de client datele sunt
  // chiar lângă motor, deci `radacinaClientDir` ignoră numele.
  writeFileSync(path.join(dest, '.client-activ'), slugClient + '\n')
}

function scrieSetari(dest: string, sablon: number) {
  const cale = path.join(dest, 'setari.md')
  let continut = existsSync(cale)
    ? readFileSync(cale, 'utf8')
    : readFileSync(path.join(SABLON, 'setari.md'), 'utf8')
  // Înlocuiește DOAR valoarea liniei „Șablon: N", păstrând restul fișierului.
  if (/^Șablon:\s*\d/m.test(continut)) {
    continut = continut.replace(/^(Șablon:\s*)\d/m, `$1${sablon}`)
  } else {
    continut = continut.replace(/(##\s*Șablon\s*\n)/, `$1\nȘablon: ${sablon}\n`)
  }
  writeFileSync(cale, continut)
}

function scrieScheletLipsa(dest: string) {
  // Copiază din scheletul de client DOAR fișierele care lipsesc — ca să nu
  // atingem `date/*.md` pre-completate de analiză.
  mkdirSync(path.join(dest, 'date'), { recursive: true })
  mkdirSync(path.join(dest, 'poze'), { recursive: true })
  mkdirSync(path.join(dest, 'en'), { recursive: true })
  const dateSablon = path.join(SABLON, 'date')
  const fisiere = existsSync(dateSablon) ? readdirSync(dateSablon).filter((f) => !f.startsWith('.')) : []
  for (const f of fisiere) {
    const tinta = path.join(dest, 'date', f)
    if (!existsSync(tinta)) cpSync(path.join(dateSablon, f), tinta)
  }
  const gk = path.join(dest, 'poze', '.gitkeep')
  if (!existsSync(gk)) writeFileSync(gk, '')
}

function scriePackageJson(dest: string, nume: string) {
  const motorPkg = JSON.parse(readFileSync(path.join(MOTOR, 'package.json'), 'utf8'))
  const pkg = {
    name: slug(nume),
    version: '1.0.0',
    private: true,
    description: `Site de cazare — ${nume}. Codul motorului nu se editează; se propagă cu actualizeaza-motor.`,
    // Scripturile motorului, cuvânt cu cuvânt: repo-ul de client E aplicația
    // Next, deci `npm run build` din rădăcină trebuie să fie chiar `next build`
    // — asta caută Vercel pe setările implicite.
    scripts: motorPkg.scripts,
    dependencies: motorPkg.dependencies,
    devDependencies: motorPkg.devDependencies,
    engines: motorPkg.engines,
  }
  writeFileSync(path.join(dest, 'package.json'), JSON.stringify(pkg, null, 2) + '\n')

  // Lockfile-ul vine copiat din motor, deci poartă numele motorului. Lăsat așa,
  // `npm ci` s-ar plânge că nu se potrivește cu package.json.
  const caleLock = path.join(dest, 'package-lock.json')
  if (!existsSync(caleLock)) return
  const lock = JSON.parse(readFileSync(caleLock, 'utf8'))
  lock.name = pkg.name
  if (lock.packages?.['']) lock.packages[''].name = pkg.name
  writeFileSync(caleLock, JSON.stringify(lock, null, 2) + '\n')
}

function scrieAuxiliare(dest: string) {
  // vercel.json și .env.example se iau din motor, ca să fie identice.
  const vercel = path.join(MOTOR, 'vercel.json')
  if (existsSync(vercel)) cpSync(vercel, path.join(dest, 'vercel.json'))
  const env = path.join(MOTOR, '.env.example')
  if (existsSync(env)) cpSync(env, path.join(dest, '.env.example'))

  writeFileSync(path.join(dest, '.gitignore'), GITIGNORE_CLIENT)
}

/* --------------------------------------------------------- CITESTE-MA */

function numeSablon(n: number): string {
  return (
    {
      1: 'Hero Video',
      2: 'Poveste alternantă',
      3: 'Galerie editorială',
      4: 'Carusel editorial',
    }[n] ?? '—'
  )
}

function scrieCiteste(dest: string, slugClient: string, sablon: number) {
  let raport: Raport
  let numeLocatie = slugClient
  let modulePornite: string[] = []
  try {
    const c = incarcaClient(slugClient)
    raport = c.raport
    numeLocatie = c.date.brand?.name || slugClient
    const m = c.setari.module
    if (m.meniuRestaurant) modulePornite.push('meniu restaurant')
    if (m.evenimente) modulePornite.push('spații de evenimente')
    if (m.galerieExtinsa) modulePornite.push('galerie extinsă')
    if (m.zona) modulePornite.push('pagina „Zona"')
    if (m.engleza) modulePornite.push('engleză')
    if (m.platiOnline) modulePornite.push('plăți online')
  } catch (e) {
    raport = new Raport()
    raport.eroare({ fisier: 'date/01-nume-logo-si-descriere.md', mesaj: e instanceof Error ? e.message.trim() : String(e), solutie: 'Completează câmpul „Nume:".' })
  }

  const deCompletat = [...raport.erori, ...raport.avertismente, ...raport.note]
  const L: string[] = []
  L.push(`# ${numeLocatie} — stare`)
  L.push('')
  L.push('> Regenerat la fiecare `npm run client-nou` și `npm run verifica`. Îl citești ca să știi unde ai rămas.')
  L.push('')
  L.push(`**Șablon:** ${sablon} · ${numeSablon(sablon)}`)
  L.push(`**Module pornite:** ${modulePornite.length ? modulePornite.join(', ') : '—'}`)
  L.push(existsSync(path.join(dest, 'PROPUNERE.md')) ? '**Analiză:** a rulat — vezi `PROPUNERE.md`' : '**Analiză:** nu a rulat')
  L.push('')
  L.push('## Completat')
  L.push('')
  const completat = rezumatCompletat(dest, slugClient)
  for (const c of completat) L.push(`- ${c}`)
  if (!completat.length) L.push('_(încă nimic — pornește de la `date/01-nume-logo-si-descriere.md`)_')
  L.push('')
  L.push('## De completat')
  L.push('')
  if (!deCompletat.length) L.push('_Nimic — datele acoperă tot ce se poate verifica automat._')
  for (const c of deCompletat) {
    const loc = [c.fisier, c.unde ? `„${c.unde}"` : null].filter(Boolean).join(' · ')
    const marca = c.nivel === 'eroare' ? '**[blochează build-ul]** ' : c.nivel === 'avertisment' ? '' : '_(opțional)_ '
    L.push(`- ${marca}\`${loc}\` — ${c.mesaj}${c.solutie ? ` ${c.solutie}` : ''}`)
  }
  L.push('')
  L.push('## Următorul pas')
  L.push('')
  L.push('```bash')
  L.push(raport.erori.length ? '# rezolvă erorile de mai sus, apoi:' : '')
  L.push('npm run dev')
  L.push('```')
  L.push('')
  writeFileSync(path.join(dest, 'CITESTE-MA.md'), L.filter((x, i, a) => !(x === '' && a[i - 1] === '')).join('\n') + '\n')
}

/** Câteva verificări de prezență, la nivel înalt, pentru „Completat". */
function rezumatCompletat(dest: string, slugClient: string): string[] {
  const out: string[] = []
  try {
    const { date } = incarcaClient(slugClient)
    if (date.brand?.name) out.push(`identitate: ${date.brand.name}`)
    if (date.contact?.phone || date.contact?.email) out.push('contact')
    if (date.rooms?.items?.length) out.push(`${date.rooms.items.length} camere`)
    if (date.offers?.items?.length) out.push(`${date.offers.items.length} oferte`)
    if (date.faq?.items?.length) out.push(`${date.faq.items.length} întrebări frecvente`)
    if (date.legal?.company) out.push('date firmă')
  } catch {
    /* raportat separat în „De completat" */
  }
  return out
}

/* ------------------------------------------------------------------ */

function main() {
  const nume = process.argv[2]
  if (!nume || nume.startsWith('-')) {
    console.error('\n  Utilizare: npm run client-nou -- <nume> --sablon <1|2|3|4> [--forteaza]\n')
    process.exit(1)
  }
  const sablon = Number(arg('--sablon') ?? '2')
  if (![1, 2, 3, 4].includes(sablon)) {
    console.error('\n  --sablon trebuie să fie 1, 2, 3 sau 4.\n')
    process.exit(1)
  }
  const slugClient = slug(nume)
  if (!slugClient) {
    console.error(`\n  „${nume}" nu produce un slug valid. Alege un nume cu litere.\n`)
    process.exit(1)
  }

  const dest = path.join(CLIENTI, slugClient)
  const construitDeja = existsSync(path.join(dest, 'package.json'))
  if (construitDeja && !process.argv.includes('--forteaza')) {
    console.error(`\n  clienti/${slugClient}/ e deja un client construit.`)
    console.error('  Nu suprascriu în tăcere. Opțiuni:')
    console.error('    · pentru un fix de motor:  npm run actualizeaza-motor -- clienti/' + slugClient)
    console.error('    · ca să-l reconstruiești (păstrează date/, poze/):  adaugă --forteaza\n')
    process.exit(1)
  }

  const analizaARulat = existsSync(path.join(dest, 'date'))
  mkdirSync(dest, { recursive: true })

  console.log(`\n  Construiesc clienti/${slugClient}/  (șablon ${sablon} · ${numeSablon(sablon)})`)
  scrieScheletLipsa(dest)
  scrieSetari(dest, sablon)
  copiazaMotor(dest, slugClient)
  scriePackageJson(dest, nume)
  scrieAuxiliare(dest)
  scrieCiteste(dest, slugClient, sablon)

  console.log(analizaARulat ? '  date/ pre-completate de analiză — păstrate.' : '  date/ din schelet — de completat.')
  console.log('\n  Gata. Următorii pași:\n')
  console.log(`    cd clienti/${slugClient}`)
  console.log('    npm install')
  console.log('    npm run dev\n')
}

main()

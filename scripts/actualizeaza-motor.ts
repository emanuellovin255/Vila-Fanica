/**
 * npm run actualizeaza-motor -- clienti/<nume> [--forteaza]
 *
 * Propagă un fix din motor într-un site deja livrat. Nu atinge `date/`,
 * `poze/`, `en/`, `setari.md`, `tasks/`, `_sursa/`, `.env`, `CITESTE-MA.md`,
 * `PROPUNERE.md`.
 *
 * În repo-ul de client motorul E rădăcina (ca Vercel să-l buildeze cu
 * setările implicite), deci nu mai există un folder `_motor/` de re-copiat.
 * Lista de căi ale motorului se citește din motorul-sursă: tot ce e la
 * primul nivel în `_motor/`, mai puțin artefactele și fișierele pe care
 * clientul le deține. Se întreține singură — un folder nou în motor se
 * propagă fără să atingi scriptul ăsta.
 *
 * `package.json` e singurul fișier fuzionat, nu copiat: numele și
 * descrierea sunt ale clientului, scripturile și dependențele sunt ale
 * motorului.
 *
 * Înainte de copiere verifică dacă motorul clientului a fost modificat
 * local. Dacă da, se OPREȘTE (REGULI.md 1: un client nu editează motorul;
 * suprascrierea silențioasă ar șterge munca cuiva). Baseline-ul e ultimul
 * commit git al repo-ului de client — de asta clientul e un repo git (T34).
 */
import { execFileSync } from 'node:child_process'
import { cpSync, existsSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { GITIGNORE_CLIENT } from './lib/layout'

const MOTOR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

/** Artefacte de build și fișiere pe care le deține clientul. */
const NU_SE_PROPAGA = new Set([
  'node_modules',
  '.next',
  '.git',
  'tsconfig.tsbuildinfo',
  '.client-activ', // marchează clientul activ — al fiecărui repo în parte
  'package.json', // fuzionat separat, ca să nu piardă numele clientului
])

function filtruMotor(sursa: string): boolean {
  const baza = path.basename(sursa)
  if (NU_SE_PROPAGA.has(baza)) return false
  if (/\/content\/(site|audit|poze)\.json$/.test(sursa)) return false
  // Tema generată și manifestul de fonturi: artefacte, rescrise la fiecare
  // dev/build din datele clientului-țintă. Copiate, ar duce tema clientului
  // greșit peste el, până la primul build.
  if (/\/styles\/tokens\.client\.css$/.test(sursa)) return false
  if (/\/public\/fonts\/\.tema\.json$/.test(sursa)) return false
  if (/\/public\/media(\/|$)/.test(sursa) && !sursa.endsWith('/media')) return false
  return true
}

/** Căile motorului, la primul nivel — exact ce se propagă într-un client. */
function caiMotor(): string[] {
  return readdirSync(MOTOR).filter((n) => !NU_SE_PROPAGA.has(n))
}

function git(cwd: string, ...args: string[]): string | null {
  try {
    return execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim()
  } catch {
    return null
  }
}

/** Scripturile și dependențele vin din motor; identitatea rămâne a clientului. */
function fuzioneazaPackageJson(clientDir: string) {
  const caleClient = path.join(clientDir, 'package.json')
  if (!existsSync(caleClient)) return
  const client = JSON.parse(readFileSync(caleClient, 'utf8'))
  const motor = JSON.parse(readFileSync(path.join(MOTOR, 'package.json'), 'utf8'))
  const fuzionat = {
    ...client,
    scripts: motor.scripts,
    dependencies: motor.dependencies,
    devDependencies: motor.devDependencies,
    engines: motor.engines,
  }
  writeFileSync(caleClient, JSON.stringify(fuzionat, null, 2) + '\n')

  // Lockfile-ul copiat poartă numele motorului. Fără corectura asta, fiecare
  // propagare ar produce un diff fals pe două linii, iar `npm ci` s-ar plânge
  // că lockfile-ul nu se potrivește cu package.json.
  const caleLock = path.join(clientDir, 'package-lock.json')
  if (!existsSync(caleLock)) return
  const lock = JSON.parse(readFileSync(caleLock, 'utf8'))
  lock.name = client.name
  if (lock.packages?.['']) lock.packages[''].name = client.name
  writeFileSync(caleLock, JSON.stringify(lock, null, 2) + '\n')
}

function main() {
  const tinta = process.argv[2]
  if (!tinta || tinta.startsWith('-')) {
    console.error('\n  Utilizare: npm run actualizeaza-motor -- clienti/<nume> [--forteaza]\n')
    process.exit(1)
  }

  // Acceptă „clienti/vila" (relativ la rădăcina proiectului, fiindcă
  // comanda rulează din _motor/), o cale relativă la cwd, sau una absolută.
  const RADACINA = path.resolve(MOTOR, '..')
  const clientDir = path.isAbsolute(tinta)
    ? tinta
    : existsSync(path.resolve(RADACINA, tinta))
      ? path.resolve(RADACINA, tinta)
      : path.resolve(process.cwd(), tinta)
  if (!existsSync(path.join(clientDir, 'setari.md'))) {
    console.error(`\n  Nu găsesc ${path.relative(process.cwd(), clientDir)}/setari.md. E „${tinta}" un repo de client construit?\n`)
    process.exit(1)
  }
  if (path.resolve(clientDir) === path.resolve(MOTOR)) {
    console.error('\n  Ăsta e chiar motorul-sursă, nu un client. Nimic de propagat.\n')
    process.exit(1)
  }

  const forteaza = process.argv.includes('--forteaza')
  const cai = caiMotor()

  /* ---------------------------- verificarea de siguranță (REGULI.md 1) */

  // Layout vechi: motorul într-un sub-folder `_motor/`. Îl migrăm mai jos, dar
  // întâi îl includem în verificarea de siguranță — altfel o modificare locală
  // din `_motor/` s-ar pierde fără să apară în listă.
  const vechiMotor = path.join(clientDir, '_motor')
  const deMigrat = existsSync(vechiMotor)
  const caiVerificate = deMigrat ? [...cai, '_motor'] : cai

  const gitRoot = git(clientDir, 'rev-parse', '--show-toplevel')
  if (gitRoot) {
    const modificat = git(clientDir, 'status', '--porcelain', '--', ...caiVerificate)
    if (modificat && !forteaza) {
      console.error('\n  OPRIT — motorul clientului are modificări locale necomise:\n')
      for (const l of modificat.split('\n')) console.error(`    ${l}`)
      console.error('\n  Regula 1 din REGULI.md: un client nu editează codul motorului.')
      console.error(`  Inspectează:  git -C ${tinta} diff ${caiVerificate.join(' ')}`)
      console.error('  Comite sau renunță la aceste schimbări, apoi reia.')
      console.error('  (Sau, dacă chiar vrei să le pierzi: --forteaza)\n')
      process.exit(1)
    }
  } else if (!forteaza) {
    console.error(`\n  „${tinta}" nu e un repo git, deci nu pot verifica dacă motorul a fost modificat local.`)
    console.error('  Fără baseline, o suprascriere ar putea șterge o modificare. Opțiuni:')
    console.error('    · pune-l sub git (recomandat, oricum e cerut la publicare)')
    console.error('    · sau, dacă ești sigur că motorul nu a fost atins: --forteaza\n')
    process.exit(1)
  }

  /* ------------------------------------------------------------ copiere */

  for (const c of cai) {
    cpSync(path.join(MOTOR, c), path.join(clientDir, c), { recursive: true, filter: filtruMotor })
  }
  fuzioneazaPackageJson(clientDir)
  // `.gitignore` e generat, nu scris de om: lista de artefacte se schimbă odată
  // cu motorul (ultimul adăugat: `content/poze.json`). Rescris de fiecare dată,
  // altfel un client vechi ar începe să comită artefacte fără să observe nimeni.
  writeFileSync(path.join(clientDir, '.gitignore'), GITIGNORE_CLIENT)
  console.log(`\n  Motor propagat în ${tinta}/.`)

  // Migrarea din layout-ul vechi. `_motor/` conținea numai cod de motor, iar
  // versiunea curentă a lui tocmai a fost scrisă în rădăcină — deci ștergerea
  // nu pierde nimic ce nu se poate reface. Se face abia după copiere, ca o
  // întrerupere să lase repo-ul cu motorul dublat, nu fără el.
  if (deMigrat) {
    // `.client-activ` e al clientului, nu al motorului, deci nu se propagă —
    // dar în layout-ul vechi stătea în `_motor/`. Fără mutarea asta, `verifica`
    // și `sync-media` ar rămâne fără client activ după migrare.
    const markerVechi = path.join(vechiMotor, '.client-activ')
    const markerNou = path.join(clientDir, '.client-activ')
    if (existsSync(markerVechi) && !existsSync(markerNou)) {
      writeFileSync(markerNou, readFileSync(markerVechi, 'utf8'))
    }
    // Symlinkul de dependențe al șabloanelor n-are rost în layout-ul nou:
    // `node_modules` e în rădăcină, deci `sabloane/` îl găsește urcând normal.
    rmSync(path.join(clientDir, 'sabloane', 'node_modules'), { force: true })
    rmSync(vechiMotor, { recursive: true, force: true })
    console.log('  Layout vechi migrat: `_motor/` șters, motorul e acum în rădăcină.')
    console.log('  Pe Vercel, pune Root Directory înapoi pe `./` dacă îl setaseși pe `_motor`.')
  }

  if (gitRoot) {
    const stat = git(clientDir, 'diff', '--stat')
    if (stat) {
      console.log('\n  Ce s-a schimbat:\n')
      for (const l of stat.split('\n')) console.log(`    ${l}`)
    } else {
      console.log('  (fără diferențe — motorul era deja la zi)')
    }
    console.log(`\n  Verifică:  git -C ${tinta} diff --stat\n`)
  } else {
    console.log(`\n  Verifică manual că doar codul motorului s-a schimbat.\n`)
  }
}

main()

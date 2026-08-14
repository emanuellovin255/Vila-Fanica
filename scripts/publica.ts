/**
 * npm run publica -- [--nume <repo>] [--da] [--dry-run]
 *
 * Duce un client de la local la live, cu securitatea pornită din prima —
 * nu adăugată „când avem timp". Rulează din rădăcina repo-ului de client —
 * care e și rădăcina motorului, fiindcă așa îl buildează Vercel implicit.
 *
 * Pași (T34), în ordine, oprindu-se la prima eroare:
 *   1. `npm run verifica` — dacă dă eroare, NU se publică nimic
 *   2. repo git inițializat + primul commit pe `main`
 *   3. repo privat pe contul Emanuellovin255 (via `gh`), push
 *   4. proiect Vercel legat de repo (via `vercel`)
 *   5. variabilele din `.env` local urcate în Vercel (niciodată în repo)
 *   6. branch protection pe `main` (fără push direct)
 *   7. Dependabot pornit, Secret Scanning verificat
 *   8. primul deploy de producție + raportarea URL-ului
 *
 * Nimic distructiv, nimic în tăcere: implicit cere o confirmare (sau `--da`),
 * iar `--dry-run` doar arată planul fără să atingă nimic extern. Cheile din
 * `.env` nu se scriu niciodată în repo (REGULI.md 6) și nu se afișează.
 */
import { execFileSync, spawnSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { createInterface } from 'node:readline'
import { fileURLToPath } from 'node:url'
import { radacinaRepo } from './lib/layout'

const MOTOR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const REPO = radacinaRepo(MOTOR)             // într-un client, chiar MOTOR
const CONT = 'Emanuellovin255'

const DRY = process.argv.includes('--dry-run')

function arg(flag: string): string | undefined {
  const i = process.argv.indexOf(flag)
  return i > -1 ? process.argv[i + 1] : undefined
}

const slug = (s: string) =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[șş]/gi, 's').replace(/[țţ]/gi, 't')
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60)

function opreste(mesaj: string): never {
  console.error(`\n  OPRIT — ${mesaj}\n`)
  process.exit(1)
}

/** Rulează o comandă, moștenind stdio; aruncă la exit ≠ 0. În dry-run doar o afișează. */
function ruleaza(cmd: string, args: string[], cwd = REPO) {
  const afis = `${cmd} ${args.join(' ')}`
  if (DRY) { console.log(`    [dry-run] ${afis}`); return }
  console.log(`    $ ${afis}`)
  const r = spawnSync(cmd, args, { cwd, stdio: 'inherit' })
  if (r.status !== 0) opreste(`comanda a eșuat: ${afis}`)
}

/** Rulează o comandă și întoarce stdout-ul (fără să arate nimic). null la eșec. */
function citeste(cmd: string, args: string[], cwd = REPO): string | null {
  try {
    return execFileSync(cmd, args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim()
  } catch { return null }
}

function exista(cmd: string): boolean {
  return citeste('which', [cmd], REPO) != null
}

async function confirma(intrebare: string): Promise<boolean> {
  if (process.argv.includes('--da')) return true
  const rl = createInterface({ input: process.stdin, output: process.stdout })
  const raspuns = await new Promise<string>((res) => rl.question(`\n  ${intrebare} [da/nu] `, res))
  rl.close()
  return /^d(a)?$/i.test(raspuns.trim())
}

/* ------------------------------------------------------------------ */

async function main() {
  const numeRepo = slug(arg('--nume') ?? path.basename(REPO))
  if (!numeRepo) opreste('nu pot deriva un nume de repo. Dă unul cu --nume <repo>.')

  // Un repo de client are `setari.md` și `date/` chiar lângă `app/`.
  // Motorul-sursă are în schimb boardul (`tasks/`, `standarde/`) un nivel mai sus.
  const eClient = existsSync(path.join(REPO, 'setari.md')) || existsSync(path.join(REPO, 'date'))
  if (!eClient) {
    opreste('pare că rulezi din motorul-sursă, nu dintr-un repo de client. Rulează `publica` din folderul unui client construit (`npm run client-nou` întâi).')
  }

  console.log(`\n  Publică: ${numeRepo}  (cont ${CONT})`)
  console.log(`  Repo local: ${REPO}`)
  if (DRY) console.log('  MOD DRY-RUN — nimic nu se schimbă extern.\n')

  /* -------------------------------------------------- 0 · unelte necesare */
  if (!DRY) {
    for (const [cmd, unde] of [['git', ''], ['gh', ' — instalează: brew install gh'], ['vercel', ' — instalează: npm i -g vercel']] as const) {
      if (!exista(cmd)) opreste(`lipsește \`${cmd}\`${unde}`)
    }
    if (citeste('gh', ['auth', 'status']) == null) opreste('`gh` nu e autentificat. Rulează: gh auth login')
  }

  /* -------------------------------------------------- 1 · verifica (blochează) */
  console.log('\n  1 · npm run verifica')
  if (!DRY) {
    const r = spawnSync('npm', ['run', 'verifica'], { cwd: MOTOR, stdio: 'inherit' })
    if (r.status !== 0) opreste('`verifica` a găsit erori. Repară-le înainte de publicare (nimic n-a fost trimis).')
  } else console.log('    [dry-run] npm run verifica')

  if (!(await confirma(`Public „${numeRepo}" ca repo PRIVAT pe ${CONT} și îl deployez pe Vercel. Continui?`))) {
    console.log('\n  Anulat. Nimic nu s-a schimbat.\n'); process.exit(0)
  }

  /* -------------------------------------------------- 2 · git + primul commit */
  console.log('\n  2 · git init + primul commit')
  if (citeste('git', ['rev-parse', '--is-inside-work-tree']) !== 'true') {
    ruleaza('git', ['init', '-b', 'main'])
  } else {
    ruleaza('git', ['checkout', '-B', 'main'])
  }
  // Plasa de siguranță: .env NU trebuie să intre niciodată în commit.
  if (!DRY && citeste('git', ['check-ignore', '.env']) == null && existsSync(path.join(REPO, '.env'))) {
    opreste('.env NU e în .gitignore, dar există local. Adaugă-l în .gitignore înainte să comit (REGULI.md 6).')
  }
  ruleaza('git', ['add', '-A'])
  if (DRY || citeste('git', ['status', '--porcelain']) !== '') {
    ruleaza('git', ['commit', '-m', 'Prima publicare — motor + conținut'])
  } else {
    console.log('    (nimic de comis — arborele e curat)')
  }

  /* -------------------------------------------------- 3 · repo privat + push */
  console.log('\n  3 · repo privat pe GitHub + push')
  const slugRepo = `${CONT}/${numeRepo}`
  if (!DRY && citeste('gh', ['repo', 'view', slugRepo]) != null) {
    console.log(`    Repo ${slugRepo} există deja — leg remote-ul și fac push.`)
    if (citeste('git', ['remote']) === null || !citeste('git', ['remote'])?.includes('origin')) {
      ruleaza('git', ['remote', 'add', 'origin', `https://github.com/${slugRepo}.git`])
    }
    ruleaza('git', ['push', '-u', 'origin', 'main'])
  } else {
    ruleaza('gh', ['repo', 'create', slugRepo, '--private', '--source', '.', '--remote', 'origin', '--push'])
  }

  /* -------------------------------------------------- 4 · proiect Vercel */
  console.log('\n  4 · proiect Vercel legat de repo')
  ruleaza('vercel', ['link', '--yes', '--project', numeRepo])

  /* -------------------------------------------------- 5 · variabile de mediu */
  console.log('\n  5 · variabile de mediu în Vercel (din .env local, fără să le arăt)')
  const envFile = path.join(REPO, '.env')
  if (existsSync(envFile)) {
    for (const linie of readFileSync(envFile, 'utf8').split(/\r?\n/)) {
      const m = linie.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/)
      if (!m) continue
      const [, cheie, valBrut] = m
      const val = valBrut.replace(/^["']|["']$/g, '')
      if (!val) continue
      console.log(`    · ${cheie}`)
      if (DRY) continue
      // `vercel env add` citește valoarea din stdin → nu apare în procesul listat.
      const r = spawnSync('vercel', ['env', 'add', cheie, 'production'], { cwd: REPO, input: val + '\n', stdio: ['pipe', 'ignore', 'inherit'] })
      if (r.status !== 0) console.warn(`      (${cheie} n-a putut fi setat — poate exista deja; verifică în Vercel)`)
    }
  } else {
    console.log('    (fără .env local — nimic de urcat)')
  }

  /* -------------------------------------------------- 6 · branch protection */
  console.log('\n  6 · branch protection pe main')
  // Fără push direct în producție: deploy doar prin PR merge.
  ruleaza('gh', ['api', '--method', 'PUT', `repos/${slugRepo}/branches/main/protection`,
    '-H', 'Accept: application/vnd.github+json',
    '-f', 'required_status_checks=null',
    '-F', 'enforce_admins=true',
    '-f', 'required_pull_request_reviews[required_approving_review_count]=0',
    '-f', 'restrictions=null'])

  /* -------------------------------------------------- 7 · Dependabot + Secret Scanning */
  console.log('\n  7 · Dependabot + Secret Scanning')
  ruleaza('gh', ['api', '--method', 'PATCH', `repos/${slugRepo}`,
    '-F', 'security_and_analysis[secret_scanning][status]=enabled',
    '-F', 'security_and_analysis[secret_scanning_push_protection][status]=enabled',
    '-F', 'security_and_analysis[dependabot_security_updates][status]=enabled'])
  const scan = citeste('gh', ['api', `repos/${slugRepo}`, '--jq', '.security_and_analysis.secret_scanning.status'])
  console.log(`    Secret Scanning: ${scan ?? '(neconfirmat — verifică în GitHub → Settings → Security)'}`)

  /* -------------------------------------------------- 8 · deploy producție */
  console.log('\n  8 · deploy de producție')
  ruleaza('vercel', ['--prod', '--yes'])
  const url = DRY ? '(dry-run)' : (citeste('vercel', ['inspect', '--wait']) ?? '(vezi ieșirea Vercel de mai sus)')

  console.log('\n  ─────────────────────────────────────────────')
  console.log(`  Publicat: https://github.com/${slugRepo}  →  Vercel`)
  console.log('\n  De verificat manual (T34):')
  console.log('    · o singură variantă de domeniu răspunde 200, cealaltă face 301')
  console.log('    · HTTPS forțat, certificat valid după propagarea DNS')
  console.log('    · security headers active (T09) pe domeniul live')
  console.log('    · rollback exersat: Vercel → Deployments → Promote to Production (sub 1 min)')
  if (url !== '(dry-run)') console.log(`\n  ${url}`)
  console.log('')
}

main().catch((err) => {
  console.error('\n  Publicarea a eșuat:', err instanceof Error ? err.message : err, '\n')
  process.exit(1)
})

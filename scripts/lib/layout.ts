import { existsSync } from 'node:fs'
import path from 'node:path'

/**
 * Unde e rădăcina repo-ului, față de rădăcina motorului.
 *
 * Același cod rulează în două locuri:
 *
 *   REPO DE CLIENT       motorul E rădăcina repo-ului (`app/` și `date/` sunt
 *                        frați). Repo-ul e o aplicație Next obișnuită, deci
 *                        Vercel îl buildează cu setările implicite.
 *
 *   REPO DE SISTEM       motorul e în `_motor/`, iar repo-ul are pe lângă el
 *                        `clienti/`, `ghiduri/`, `tasks/`.
 *
 * Semnul distinctiv e `setari.md` / `date/` chiar lângă motor: numai un client
 * le are acolo.
 */
export function radacinaRepo(motor: string): string {
  if (existsSync(path.join(motor, 'setari.md')) || existsSync(path.join(motor, 'date'))) return motor
  return path.resolve(motor, '..')
}

/** Adevărat dacă motorul ăsta e rădăcina unui repo de client. */
export function eRepoClient(motor: string): boolean {
  return radacinaRepo(motor) === motor
}

/**
 * `.gitignore`-ul unui repo de client. Stă aici, nu în `client-nou`, fiindcă
 * îl scrie și `actualizeaza-motor` când migrează un client din layout-ul vechi
 * — unde căile erau prefixate cu `_motor/`. Lăsat nemigrat, `.next/` ar ajunge
 * comis în repo.
 */
export const GITIGNORE_CLIENT = [
  '# dependențe',
  'node_modules/',
  '',
  '# build',
  '.next/',
  'tsconfig.tsbuildinfo',
  'public/media/',
  'content/site.json',
  'content/audit.json',
  'content/poze.json',
  // Tema clientului și fonturile ei, generate de scripts/tema.ts la fiecare
  // dev/build. `prebuild` rulează înaintea lui `next build`, inclusiv pe
  // Vercel, deci lipsa lor din repo nu poate rupe un deploy.
  'styles/tokens.client.css',
  '',
  '# macOS',
  '.DS_Store',
  '',
  '# secrete — niciodată în repo (REGULI.md 6)',
  '.env',
  '.env.local',
  '.env.*.local',
  '',
].join('\n')

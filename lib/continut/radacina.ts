import { existsSync } from 'node:fs'
import path from 'node:path'

/** Un folder arată a client dacă are `setari.md` sau `date/`. */
function eClient(dir: string): boolean {
  return existsSync(path.join(dir, 'setari.md')) || existsSync(path.join(dir, 'date'))
}

/**
 * Rădăcina folderului de date al unui client, relativ la cwd — care e
 * rădăcina aplicației Next (`next dev` / `next build` rulează de acolo).
 *
 * Un singur motor, două layout-uri — regula 1 din REGULI.md ține: motorul
 * nu se schimbă per client, doar știe unde să caute.
 *
 *   REPO DE CLIENT              cwd însuși
 *     Ce livrează `npm run client-nou`: motorul stă în rădăcina repo-ului,
 *     cu `date/`, `poze/`, `en/` și `setari.md` chiar lângă `app/`. Așa,
 *     repo-ul e o aplicație Next obișnuită: Vercel îl buildează cu setările
 *     implicite, fără Root Directory și fără Output Directory de ajustat.
 *
 *   MONOREPO de sistem/dev      `../clienti/<nume>/`
 *     Aici motorul e în `_motor/` și are mulți clienți lângă el, în
 *     `clienti/`. Tot aici trăiesc demo-urile.
 *
 * Ordinea contează: întâi cwd, fiindcă într-un repo de client `../` e
 * folderul care conține repo-ul și n-are nicio treabă cu el.
 */
export function radacinaClientDir(nume: string): string {
  const cwd = process.cwd()
  if (eClient(cwd)) return cwd

  const monorepo = path.resolve(cwd, '..', 'clienti', nume)
  if (existsSync(monorepo)) return monorepo

  // Repo de client în layout-ul vechi (motorul într-un sub-folder `_motor/`).
  // Rămâne pentru site-urile publicate înainte de restructurare.
  const vechi = path.resolve(cwd, '..')
  if (eClient(vechi)) return vechi

  return monorepo
}

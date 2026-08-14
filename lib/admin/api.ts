/* ============================================================
   api.ts — ce e comun tuturor rutelor panoului.

   Parte din panoul de administrare, o modificare locală față de
   motorul-sursă. Vezi `MOTOR-MODIFICAT.md`.
   ============================================================ */

import { EroarePatch } from './patch'
import { EroareGitHub, esteConflict } from './depozit'

/** Niciun răspuns al panoului nu are voie să fie cache-uit. */
export const FARA_CACHE = { 'Cache-Control': 'no-store, must-revalidate' }

export function ok(date: unknown): Response {
  return Response.json(date, { headers: FARA_CACHE })
}

export function eroare(mesaj: string, status = 400, extra: Record<string, unknown> = {}): Response {
  return Response.json({ eroare: mesaj, ...extra }, { status, headers: FARA_CACHE })
}

/**
 * Traduce orice a mers prost în ceva ce gazda poate citi și rezolva.
 *
 * Regula: mesajul ajunge pe ecranul cuiva care nu poate citi codul, deci
 * spune CE s-a întâmplat și CE are de făcut — niciodată „500 Internal
 * Server Error".
 */
export function eroareLaSalvare(e: unknown): Response {
  if (esteConflict(e)) {
    return eroare(
      'Cineva a modificat fișierul între timp — poate tu, din alt tab, sau direct din GitHub. ' +
        'Reîncarcă pagina ca să vezi ce e acum, apoi fă schimbarea din nou.',
      409,
      { conflict: true },
    )
  }
  if (e instanceof EroarePatch) {
    return eroare(`Nu am putut face schimbarea: ${e.message}`, 400)
  }
  if (e instanceof EroareGitHub) {
    if (e.status === 401 || e.status === 403) {
      return eroare(
        'GitHub a refuzat scrierea. Token-ul din ADMIN_GITHUB_TOKEN e expirat sau nu are ' +
          'permisiunea „Contents: Read and write" pe acest repo.',
        502,
      )
    }
    return eroare(e.message, 502)
  }
  console.error('panou:', e)
  return eroare('Ceva a mers prost la salvare. Încearcă din nou; dacă se repetă, sună partea tehnică.', 500)
}

/** IP-ul cererii, pentru limitarea de rată la intrare. */
export function ipul(cerere: Request): string {
  const h = cerere.headers
  return (
    h.get('x-forwarded-for')?.split(',')[0].trim() ||
    h.get('x-real-ip') ||
    h.get('cf-connecting-ip') ||
    'necunoscut'
  )
}

/**
 * Un nume de fișier de poză, curățat.
 *
 * Nu acceptăm niciun `/`, niciun `..`, nimic în afară de litere fără
 * diacritice, cifre, cratime, puncte. Numele vine dintr-un parametru de
 * URL, deci e cea mai expusă intrare a panoului — validarea stă și aici,
 * și în `depozit.ts`, unde e ultima poartă înainte de disc.
 */
export function numeSigur(nume: string): string | null {
  const n = nume.trim()
  if (!n || n.length > 120) return null
  if (!/^[A-Za-z0-9._-]+$/.test(n)) return null
  if (n.startsWith('.') || n.includes('..')) return null
  return n
}

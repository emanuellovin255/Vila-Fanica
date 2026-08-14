import { eroare, ipul, ok } from '@/lib/admin/api'
import { intra } from '@/lib/admin/sesiune'

/**
 * Intrarea în panou. Parola vine în corp, niciodată în URL — un URL
 * ajunge în istoric, în loguri și în `Referer`.
 */
export async function POST(cerere: Request): Promise<Response> {
  let parola = ''
  try {
    const corp = (await cerere.json()) as { parola?: unknown }
    parola = typeof corp.parola === 'string' ? corp.parola : ''
  } catch {
    return eroare('Cerere fără parolă.')
  }

  if (!parola) return eroare('Scrie parola.')

  const r = await intra(parola, ipul(cerere))
  if (r.ok) return ok({ ok: true })

  if (r.motiv === 'neconfigurat') {
    return eroare(
      'Panoul nu e configurat încă: lipsesc ADMIN_PAROLA și ADMIN_SECRET din setările Vercel.',
      503,
    )
  }
  if (r.motiv === 'prea-multe-încercări') {
    const minute = Math.ceil((r.asteaptaSec ?? 300) / 60)
    return eroare(`Prea multe încercări. Mai încearcă în ${minute} ${minute === 1 ? 'minut' : 'minute'}.`, 429)
  }
  return eroare('Parola nu e bună.', 401)
}

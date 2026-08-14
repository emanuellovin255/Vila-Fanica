import { genereazaLlms } from '@/lib/seo/llms'
import { baseUrl } from '@/lib/seo/meta'
import { siteCurent } from '@/lib/site'

/**
 * `/llms.txt` — harta site-ului pentru asistenții AI (T07).
 *
 * Route handler static: se generează o dată, la build, din datele
 * site-ului. `dynamic = 'force-static'` îl scoate din calea de execuție
 * la fiecare cerere — e conținut, nu logică.
 */
export const dynamic = 'force-static'

export function GET() {
  const { date, setari } = siteCurent()
  const corp = genereazaLlms(date, setari, baseUrl())
  return new Response(corp, {
    headers: { 'content-type': 'text/plain; charset=utf-8' },
  })
}

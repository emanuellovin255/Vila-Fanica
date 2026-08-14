/* ============================================================
   Previzualizarea unei poze din `poze/`.

   DE CE UN PROXY, ȘI NU `/media/<nume>`
   -------------------------------------
   `public/media/` se generează la build din `poze/`. O poză încărcată
   acum din panou NU e încă acolo — ar apărea abia după ce site-ul se
   reconstruiește. Gazda ar trage poza, ar vedea un pătrat gol și ar trage-o
   din nou.

   Deci panoul citește direct din depozit, cu token-ul serverului. Merge și
   pe repo privat, și pentru poze care n-au ajuns încă în build.
   ============================================================ */

import { eroare, numeSigur } from '@/lib/admin/api'
import { citesteOcteti } from '@/lib/admin/depozit'
import { cereSesiune } from '@/lib/admin/sesiune'

const TIPURI: Record<string, string> = {
  webp: 'image/webp',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  avif: 'image/avif',
  gif: 'image/gif',
  svg: 'image/svg+xml',
  mp4: 'video/mp4',
  webm: 'video/webm',
  mov: 'video/quicktime',
}

export async function GET(
  _cerere: Request,
  { params }: { params: Promise<{ nume: string }> },
): Promise<Response> {
  const refuz = await cereSesiune()
  if (refuz) return refuz

  const { nume: brut } = await params
  const nume = numeSigur(decodeURIComponent(brut))
  if (!nume) return eroare('Nume de fișier nepermis.', 400)

  const ext = nume.split('.').pop()?.toLowerCase() ?? ''
  const tip = TIPURI[ext]
  if (!tip) return eroare('Tip de fișier neacceptat.', 400)

  const octeti = await citesteOcteti(`poze/${nume}`)
  if (!octeti) return eroare('Poza nu există.', 404)

  return new Response(new Uint8Array(octeti), {
    headers: {
      'Content-Type': tip,
      // `private`: răspunsul e legat de sesiune, nu are ce căuta într-un
      // cache comun. Un minut e destul cât ține o pagină deschisă.
      'Cache-Control': 'private, max-age=60',
      'Content-Disposition': `inline; filename="${nume}"`,
    },
  })
}

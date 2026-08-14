import type { Limba } from './limbi'
import { siteCurent } from '@/lib/site'

/* ============================================================
   perechi.ts — perechea unei pagini `[slug]` în celelalte limbi.

   PROBLEMA (T08, T61)
   -------------------
   Segmentele de nivel înalt se traduc dintr-o hartă (`rute.ts`:
   camere↔rooms). Slug-urile nu: `camera-dubla-cu-balcon` în română e
   `double-room-with-balcony` în engleză, iar amândouă se generează din
   titlul `##` al fișierului limbii respective. Nu există regulă care să
   ducă de la unul la altul.

   Fără o pereche, două lucruri se rup pe `/en`: comutatorul de limbă
   trimite pe un slug inexistent, iar `hreflang` declară o corespondență
   falsă — Google o ignoră și tratează paginile ca duplicate.

   SOLUȚIA: POZIȚIA
   ----------------
   `en/04-camere.md` e traducerea lui `date/04-camere.md`, deci are
   aceleași camere, în aceeași ordine. A cincea cameră din română e a
   cincea cameră din engleză. Indexul e perechea.

   E o convenție, nu o deducere — de asta e scrisă aici, explicit: cine
   reordonează un fișier de limbă fără celălalt strică maparea. În
   schimb, nu cere niciun câmp nou în markdown și nu poate rămâne
   nesincronizată tăcut: dacă lipsește poziția, se cade pe slug-ul
   curent, deci linkul rămâne valid chiar dacă nu e tradus.

   Stă separat de `rute.ts` DINADINS: aici se citesc datele
   (`lib/site.ts` → `node:fs`), iar `rute.ts` e importat de
   `middleware.ts`, care rulează pe edge.
   ============================================================ */

type Tip = 'camere' | 'oferte'

function slugsPentru(tip: Tip, limba: Limba): string[] {
  const { date } = siteCurent(limba)
  return tip === 'camere' ? date.rooms.items.map((c) => c.slug) : date.offers.items.map((o) => o.slug)
}

/**
 * Calea internă a aceleiași camere/oferte în fiecare limbă cerută.
 *
 * Întoarce căi FĂRĂ prefix de limbă și cu segmentul netradus
 * (`/camere/<slug>`) — traducerea segmentului o face `traduSegment`, mai
 * târziu, ca să rămână un singur loc care știe camere↔rooms.
 */
export function caiPereche(
  tip: Tip,
  slugCurent: string,
  limbaCurenta: Limba,
  limbi: Limba[],
): Partial<Record<Limba, string>> {
  const cai: Partial<Record<Limba, string>> = {}
  const index = slugsPentru(tip, limbaCurenta).indexOf(slugCurent)

  for (const l of limbi) {
    if (l === limbaCurenta) {
      cai[l] = `/${tip}/${slugCurent}`
      continue
    }
    const slugs = slugsPentru(tip, l)
    // Fără pereche pe poziția asta, păstrăm slug-ul curent: mai bine un
    // link netradus decât unul mort (aceeași regulă ca la segmente).
    cai[l] = `/${tip}/${(index >= 0 && slugs[index]) || slugCurent}`
  }

  return cai
}

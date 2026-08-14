/* ============================================================
   Setările: ce module sunt pornite și ce secțiuni apar pe prima pagină.

   Parte din panoul de administrare, o modificare locală față de
   motorul-sursă. Vezi `MOTOR-MODIFICAT.md`.

   `setari.md` e altfel decât fișierele din `date/`: secțiunile de pe
   prima pagină nu sunt blocuri, sunt CÂMPURI, iar ordinea rândurilor lor
   e ordinea secțiunilor pe site. De aici două operații speciale —
   ștergerea unui câmp (scoate secțiunea) și reordonarea câmpurilor.
   ============================================================ */

import { eroare, eroareLaSalvare, ok } from '@/lib/admin/api'
import { citeste, scrie, starea } from '@/lib/admin/depozit'
import { citesteBlocuri, ordoneazaCampuri, setCamp, stergeCamp } from '@/lib/admin/patch'
import { cereSesiune } from '@/lib/admin/sesiune'

const CALE = 'setari.md'

const BLOC_MODULE = 'Module'
const BLOC_SECTIUNI = 'Secțiuni pe prima pagină'
const BLOC_ALTELE = 'Altele'

/** Modulele, cu explicația lor. Cheia trebuie să fie exact cea din fișier. */
const MODULE = [
  {
    cheie: 'meniu restaurant',
    cheieScrisa: 'Meniu restaurant',
    eticheta: 'Meniul restaurantului',
    ajutor: 'Pagina /meniu, cu preparatele și prețurile. Oprit, dispare și linkul din meniul de sus.',
  },
  {
    cheie: 'spatii de evenimente',
    cheieScrisa: 'Spații de evenimente',
    eticheta: 'Spații de evenimente',
    ajutor: 'Pentru nunți sau conferințe. Cere texte scrise în prima pagină — acum nu există.',
  },
  {
    cheie: 'galerie extinsa',
    cheieScrisa: 'Galerie extinsă',
    eticheta: 'Pagina de galerie',
    ajutor: 'O pagină separată cu toate pozele folosite pe site. Nu cere nimic scris în plus.',
  },
  {
    cheie: 'pagina „zona" (atractii si distante)',
    cheieScrisa: 'Pagina „Zona" (atracții și distanțe)',
    eticheta: 'Pagina „Zona"',
    ajutor: 'Atracții și distanțe. Aduce trafic din căutări de tip „ce e de văzut în Deltă".',
  },
  {
    cheie: 'engleza',
    cheieScrisa: 'Engleză',
    eticheta: 'Site-ul în engleză',
    ajutor: 'Pornită: la prima vizită site-ul întreabă Română / English. Cere fișierele din en/ traduse.',
  },
] as const

const ALTELE = [
  {
    cheie: 'buton whatsapp',
    cheieScrisa: 'Buton WhatsApp',
    eticheta: 'Butonul verde de WhatsApp',
    ajutor: 'Un link simplu, nu un widget. Cere numărul de WhatsApp la datele de contact.',
  },
  {
    cheie: 'analytics',
    cheieScrisa: 'Analytics',
    eticheta: 'Statistici de trafic',
    ajutor: 'Se încarcă doar după ce vizitatorul acceptă cookie-urile.',
  },
] as const

export async function GET(): Promise<Response> {
  const refuz = await cereSesiune()
  if (refuz) return refuz

  const fisier = await citeste(CALE)
  if (!fisier) return eroare('setari.md lipsește din repo.', 404)

  const blocuri = citesteBlocuri(fisier.continut, 2)
  const bloc = (titlu: string) => blocuri.find((b) => b.titlu.toLowerCase() === titlu.toLowerCase())

  const module = bloc(BLOC_MODULE)?.campuri ?? {}
  const sectiuni = bloc(BLOC_SECTIUNI)?.campuri ?? {}
  const altele = bloc(BLOC_ALTELE)?.campuri ?? {}

  return ok({
    sha: fisier.sha,
    depozit: starea(),
    module: MODULE.map((m) => ({ ...m, pornit: (module[m.cheie] ?? 'nu').toLowerCase().startsWith('d') })),
    // Ordinea din fișier E ordinea de pe site.
    sectiuni: Object.entries(sectiuni).map(([cheie, valoare]) => ({
      cheie,
      pornit: valoare.toLowerCase().startsWith('d'),
    })),
    altele: ALTELE.map((a) => ({ ...a, pornit: (altele[a.cheie] ?? 'nu').toLowerCase().startsWith('d') })),
    meniuPdf: altele['meniu pdf'] ?? '',
  })
}

/* ------------------------------------------------------------------ */

interface Corp {
  sha?: string
  module?: Record<string, boolean>
  altele?: Record<string, boolean>
  /** Secțiunile pornite, ÎN ORDINEA dorită pe prima pagină. */
  sectiuni?: string[]
  /** Secțiunile oprite: rândul lor se scoate din fișier. */
  sectiuniOprite?: string[]
}

export async function PUT(cerere: Request): Promise<Response> {
  const refuz = await cereSesiune()
  if (refuz) return refuz

  let corp: Corp
  try {
    corp = (await cerere.json()) as Corp
  } catch {
    return eroare('Cerere greșită.')
  }

  const fisier = await citeste(CALE)
  if (!fisier) return eroare('setari.md lipsește din repo.', 404)

  try {
    let text = fisier.continut

    for (const m of MODULE) {
      const v = corp.module?.[m.cheie]
      if (v === undefined) continue
      text = setCamp(text, { titlu: BLOC_MODULE }, m.cheieScrisa, v ? 'da' : 'nu')
    }

    for (const a of ALTELE) {
      const v = corp.altele?.[a.cheie]
      if (v === undefined) continue
      text = setCamp(text, { titlu: BLOC_ALTELE }, a.cheieScrisa, v ? 'da' : 'nu')
    }

    // Secțiunile oprite se ȘTERG, nu se pun pe „nu": așa spune formatul, și
    // așa arată și fișierul livrat.
    for (const cheie of corp.sectiuniOprite ?? []) {
      text = stergeCamp(text, { titlu: BLOC_SECTIUNI }, cheie)
    }

    if (corp.sectiuni?.length) {
      // Cele pornite care nu mai există în fișier (fuseseră scoase) se pun
      // înapoi, apoi tot blocul se reordonează după lista primită.
      const acum = citesteBlocuri(text, 2).find((b) => b.titlu.toLowerCase() === BLOC_SECTIUNI.toLowerCase())
      for (const cheie of corp.sectiuni) {
        if (!acum || acum.campuri[cheie] === undefined) {
          text = setCamp(text, { titlu: BLOC_SECTIUNI }, cheie, 'da')
        }
      }
      text = ordoneazaCampuri(text, { titlu: BLOC_SECTIUNI }, corp.sectiuni)
    }

    if (text === fisier.continut) return ok({ ok: true, nimicSchimbat: true, sha: fisier.sha })

    const r = await scrie({ cale: CALE, continut: text, sha: corp.sha || fisier.sha, mesaj: 'Panou: setări' })
    return ok({ ok: true, sha: r.sha })
  } catch (e) {
    return eroareLaSalvare(e)
  }
}

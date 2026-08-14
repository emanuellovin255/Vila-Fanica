/* ============================================================
   Ruta de conținut: citește un fișier pentru formular și îl scrie înapoi.

   Parte din panoul de administrare, o modificare locală față de
   motorul-sursă. Vezi `MOTOR-MODIFICAT.md`.

   TREI VERBE, TREI ROLURI
   -----------------------
   GET   umple formularul: blocurile fișierului, cu valorile lor.
   PUT   salvează valorile — trimise TOATE, nu doar cele schimbate.
   POST  schimbări de structură: adaugă, șterge, mută un element.

   DE CE PUT PRIMEȘTE TOT
   ----------------------
   Un formular nu știe ce a atins gazda. Trimite tot, iar `patch.ts`
   filtrează: `setCamp` iese imediat dacă valoarea e neschimbată. Deci
   fișierul primește exact liniile modificate, chiar dacă cererea conține
   patruzeci de câmpuri. Alternativa — să urmărim „câmpuri murdare" în
   browser — ar muta responsabilitatea corectitudinii în interfață, unde
   un bug e invizibil.
   ============================================================ */

import { eroare, eroareLaSalvare, ok } from '@/lib/admin/api'
import { citeste, scrie } from '@/lib/admin/depozit'
import {
  adaugaBloc,
  citesteBlocuri,
  mutaBloc,
  setCamp,
  setDescriere,
  stergeBloc,
  type Selector,
} from '@/lib/admin/patch'
import { campuriDin, fisierPanou, type Fisier } from '@/lib/admin/schema'
import { cereSesiune } from '@/lib/admin/sesiune'

/** Folderul limbii. Româna e în `date/`, engleza în `en/`. */
function folder(limba: string): string {
  return limba === 'en' ? 'en' : 'date'
}

function caleaFisierului(f: Fisier, limba: string): string {
  return `${folder(limba)}/${f.fisier}`
}

async function incarca(f: Fisier, limba: string) {
  const cale = caleaFisierului(f, limba)
  const fisier = await citeste(cale)
  if (!fisier) return null

  const text = fisier.continut
  if (f.forma.fel === 'fixe') {
    const toate = citesteBlocuri(text, 2)
    return {
      cale,
      sha: fisier.sha,
      blocuri: f.forma.blocuri.map((b) => {
        const gasit = toate.find((x) => x.titlu.toLowerCase() === b.titlu.toLowerCase())
        return {
          titlu: b.titlu,
          index: gasit?.index ?? -1,
          campuri: gasit?.campuri ?? {},
          descriere: gasit?.descriere ?? '',
        }
      }),
    }
  }

  // Listă: antetul (dacă are) nu e element, deci se scoate din listă.
  const antetTitlu = f.forma.antet?.titlu.toLowerCase()
  const toate = citesteBlocuri(text, 2)
  return {
    cale,
    sha: fisier.sha,
    antet: antetTitlu ? (toate.find((x) => x.titlu.toLowerCase() === antetTitlu) ?? null) : null,
    blocuri: toate.filter((x) => x.titlu.toLowerCase() !== antetTitlu),
  }
}

/* ------------------------------------------------------------------ */

export async function GET(cerere: Request): Promise<Response> {
  const refuz = await cereSesiune()
  if (refuz) return refuz

  const u = new URL(cerere.url)
  const f = fisierPanou(u.searchParams.get('id') ?? '')
  if (!f) return eroare('Nu știu ce fișier să deschid.', 404)

  const limba = u.searchParams.get('limba') === 'en' ? 'en' : 'ro'
  const date = await incarca(f, limba)
  if (!date) {
    return eroare(
      limba === 'en'
        ? `Fișierul en/${f.fisier} nu există încă. Traducerea acestei secțiuni nu e pornită.`
        : `Fișierul date/${f.fisier} lipsește din repo.`,
      404,
    )
  }
  return ok(date)
}

/* ------------------------------------------------------------------ */

interface CorpSalvare {
  id?: string
  limba?: string
  sha?: string
  blocuri?: Array<{ index: number; campuri?: Record<string, string>; descriere?: string }>
  antet?: { campuri?: Record<string, string> }
}

export async function PUT(cerere: Request): Promise<Response> {
  const refuz = await cereSesiune()
  if (refuz) return refuz

  let corp: CorpSalvare
  try {
    corp = (await cerere.json()) as CorpSalvare
  } catch {
    return eroare('Cerere greșită.')
  }

  const f = fisierPanou(corp.id ?? '')
  if (!f) return eroare('Nu știu ce fișier să salvez.', 404)

  const limba = corp.limba === 'en' ? 'en' : 'ro'
  const cale = caleaFisierului(f, limba)
  const fisier = await citeste(cale)
  if (!fisier) return eroare(`Fișierul ${cale} lipsește.`, 404)

  // Cheile pe care schema le cunoaște. Orice altceva venit din browser e
  // ignorat: panoul nu are voie să scrie câmpuri care nu-i aparțin.
  const cunoscute = new Set(campuriDin(f).map((c) => c.cheie))
  const cheieScrisa = new Map(campuriDin(f).map((c) => [c.cheie, c.cheieScrisa]))

  try {
    let text = fisier.continut

    if (corp.antet && f.forma.fel === 'lista' && f.forma.antet) {
      const sel: Selector = { titlu: f.forma.antet.titlu }
      for (const [cheie, valoare] of Object.entries(corp.antet.campuri ?? {})) {
        if (!cunoscute.has(cheie)) continue
        text = setCamp(text, sel, cheieScrisa.get(cheie) ?? cheie, valoare)
      }
    }

    for (const b of corp.blocuri ?? []) {
      if (typeof b.index !== 'number' || b.index < 0) continue
      const sel: Selector = { index: b.index }
      for (const [cheie, valoare] of Object.entries(b.campuri ?? {})) {
        if (!cunoscute.has(cheie)) continue
        text = setCamp(text, sel, cheieScrisa.get(cheie) ?? cheie, valoare)
      }
      if (b.descriere !== undefined) text = setDescriere(text, sel, b.descriere)
    }

    if (text === fisier.continut) return ok({ ok: true, nimicSchimbat: true, sha: fisier.sha })

    const r = await scrie({
      cale,
      continut: text,
      sha: corp.sha || fisier.sha,
      mesaj: `Panou: ${f.titlu.toLowerCase()}${limba === 'en' ? ' (engleză)' : ''}`,
    })
    return ok({ ok: true, sha: r.sha })
  } catch (e) {
    return eroareLaSalvare(e)
  }
}

/* ------------------------------------------------------------------ */

interface CorpStructura {
  id?: string
  limba?: string
  sha?: string
  actiune?: 'adauga' | 'sterge' | 'muta'
  /** La `adauga`: titlul elementului nou. */
  titlu?: string
  /** La `sterge` și `muta`: poziția elementului, de la 0. */
  index?: number
  directie?: 'sus' | 'jos'
}

/** Blocul-șablon al unui element nou: exact câmpurile pe care le știe formularul. */
function sablon(f: Fisier): string {
  if (f.forma.fel !== 'lista') return ''
  const randuri = f.forma.campuri.map((c) => `${c.cheieScrisa}: `)
  return randuri.length ? '\n' + randuri.join('\n') : ''
}

export async function POST(cerere: Request): Promise<Response> {
  const refuz = await cereSesiune()
  if (refuz) return refuz

  let corp: CorpStructura
  try {
    corp = (await cerere.json()) as CorpStructura
  } catch {
    return eroare('Cerere greșită.')
  }

  const f = fisierPanou(corp.id ?? '')
  if (!f) return eroare('Nu știu ce fișier să schimb.', 404)
  if (f.forma.fel !== 'lista') return eroare('Fișierul ăsta n-are elemente de adăugat sau șters.', 400)

  const limba = corp.limba === 'en' ? 'en' : 'ro'
  const cale = caleaFisierului(f, limba)
  const fisier = await citeste(cale)
  if (!fisier) return eroare(`Fișierul ${cale} lipsește.`, 404)

  // Indexul din formular numără elementele; blocurile din fișier îl includ
  // și pe antet. Decalajul se adună o dată, aici.
  const decalaj = f.forma.antet ? 1 : 0

  try {
    let text = fisier.continut
    let mesaj: string

    if (corp.actiune === 'adauga') {
      const titlu = (corp.titlu ?? '').trim()
      if (!titlu) return eroare(`Scrie un nume pentru ${f.forma.singular}a nouă.`)
      const exista = citesteBlocuri(text, 2).some((b) => b.titlu.toLowerCase() === titlu.toLowerCase())
      if (exista) return eroare(`Există deja „${titlu}". Alege alt nume.`)
      text = adaugaBloc(text, { titlu, sablon: sablon(f) })
      mesaj = `Panou: ${f.forma.singular} nouă — ${titlu}`
    } else if (corp.actiune === 'sterge') {
      if (typeof corp.index !== 'number') return eroare('Nu știu ce element să șterg.')
      const bloc = citesteBlocuri(text, 2)[corp.index + decalaj]
      text = stergeBloc(text, { index: corp.index + decalaj })
      mesaj = `Panou: șters — ${bloc?.titlu ?? f.forma.singular}`
    } else if (corp.actiune === 'muta') {
      if (typeof corp.index !== 'number' || !corp.directie) return eroare('Nu știu ce element să mut.')
      const bloc = citesteBlocuri(text, 2)[corp.index + decalaj]
      text = mutaBloc(text, { index: corp.index + decalaj }, corp.directie)
      mesaj = `Panou: mutat ${corp.directie} — ${bloc?.titlu ?? f.forma.singular}`
    } else {
      return eroare('Acțiune necunoscută.')
    }

    const r = await scrie({ cale, continut: text, sha: corp.sha || fisier.sha, mesaj })
    return ok({ ok: true, sha: r.sha })
  } catch (e) {
    return eroareLaSalvare(e)
  }
}

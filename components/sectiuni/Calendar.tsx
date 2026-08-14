'use client'

import { useMemo, useState } from 'react'

import { Icon } from '@/components/Icon'
import type { SiteData } from '@/content/types'

/** Textele motorului în limba paginii (`date.ui`). */
type Ui = SiteData['ui']

/* ============================================================
   Calendar de perioadă (T64) — sosire/plecare, ca la un motor de rezervări.

   Scris de mână, fără bibliotecă de date: tot ce-i trebuie e o grilă de
   luni și o comparație de șiruri. O bibliotecă de calendar ar fi adăugat
   zeci de KB de JavaScript pentru exact atât (standarde/02, bugetul de
   greutate), iar formatele de dată sunt oricum ale noastre.

   Datele circulă ca `YYYY-MM-DD`, NU ca `Date`. Un `Date` are oră și fus
   orar; o rezervare n-are nici una, nici alta. Din cauza asta un oaspete
   din alt fus ar fi putut alege 12 august și trimite 11 august — bug tăcut,
   imposibil de reprodus de acasă. Cu șiruri, ziua aleasă e ziua trimisă.
   ============================================================ */

/** `2026-08-07`, în ora LOCALĂ (nu UTC — vezi comentariul de sus). */
export function iso(d: Date): string {
  const l = String(d.getMonth() + 1).padStart(2, '0')
  const z = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${l}-${z}`
}

/** Ziua de azi, ca ISO local. */
export function azi(): string {
  return iso(new Date())
}

type Celula = { zi: number; iso: string } | null

/** Zilele unei luni, aliniate la coloane, cu săptămâna începută luni. */
function grila(an: number, luna: number): Celula[] {
  const prima = new Date(an, luna, 1)
  // getDay(): 0 = duminică. Noi vrem 0 = luni.
  const decalaj = (prima.getDay() + 6) % 7
  const zile = new Date(an, luna + 1, 0).getDate()
  const celule: Celula[] = Array(decalaj).fill(null)
  for (let z = 1; z <= zile; z++) celule.push({ zi: z, iso: iso(new Date(an, luna, z)) })
  return celule
}

function Luna({
  an,
  luna,
  ui,
  checkIn,
  checkOut,
  minim,
  onAlege,
}: {
  an: number
  luna: number
  ui: Ui
  checkIn: string
  checkOut: string
  minim: string
  onAlege: (zi: string) => void
}) {
  const celule = useMemo(() => grila(an, luna), [an, luna])

  return (
    <div className="cal-luna">
      <p className="cal-titlu" aria-hidden="true">
        {ui.luni[luna]} {an}
      </p>
      <div className="cal-zile" role="presentation">
        {ui.zile.map((z) => (
          <span className="cal-cap" key={z}>
            {z}
          </span>
        ))}
        {celule.map((c, i) => {
          if (!c) return <span key={`g${i}`} />
          const trecut = c.iso < minim
          const eIn = c.iso === checkIn
          const eOut = c.iso === checkOut
          const intre = Boolean(checkIn && checkOut && c.iso > checkIn && c.iso < checkOut)

          return (
            <button
              key={c.iso}
              type="button"
              className="cal-zi"
              disabled={trecut}
              data-in={eIn || undefined}
              data-out={eOut || undefined}
              data-intre={intre || undefined}
              aria-pressed={eIn || eOut}
              // Data completă pentru cititoarele de ecran; în pagină se vede doar cifra.
              aria-label={`${c.zi} ${ui.luniMici[luna]} ${an}`}
              onClick={() => onAlege(c.iso)}
            >
              {c.zi}
            </button>
          )
        })}
      </div>
    </div>
  )
}

/**
 * Două luni alăturate pe ecran lat, una pe telefon (decis din CSS, ca să
 * nu depindem de lățimea ferestrei în JavaScript).
 *
 * Regula de selecție e cea de la orice motor de rezervări, fiindcă e cea
 * pe care oamenii o cunosc deja: primul click pune sosirea, al doilea
 * plecarea. Un click pe o zi ≤ sosire reîncepe perioada de acolo, în loc
 * să dea eroare — e ce vrea omul care s-a răzgândit.
 */
export function Calendar({
  ui,
  checkIn,
  checkOut,
  onSchimba,
}: {
  ui: Ui
  checkIn: string
  checkOut: string
  onSchimba: (checkIn: string, checkOut: string) => void
}) {
  const minim = azi()
  const start = checkIn || minim
  const [ancora, setAncora] = useState(() => {
    const [a, l] = start.split('-').map(Number)
    return { an: a, luna: l - 1 }
  })

  function muta(pas: number) {
    setAncora((p) => {
      const d = new Date(p.an, p.luna + pas, 1)
      return { an: d.getFullYear(), luna: d.getMonth() }
    })
  }

  function alege(zi: string) {
    if (!checkIn || checkOut || zi <= checkIn) {
      onSchimba(zi, '')
      return
    }
    onSchimba(checkIn, zi)
  }

  const urm = new Date(ancora.an, ancora.luna + 1, 1)
  // Nu se poate naviga înainte de luna curentă: n-are ce alege acolo.
  const inapoiOprit = `${ancora.an}-${String(ancora.luna + 1).padStart(2, '0')}` <= minim.slice(0, 7)

  return (
    <div className="cal">
      <div className="cal-bara">
        <button type="button" className="cal-nav" onClick={() => muta(-1)} disabled={inapoiOprit} aria-label={ui.lunaAnterioara}>
          <Icon name="arrow" marime="sm" />
        </button>
        <button type="button" className="cal-nav" onClick={() => muta(1)} aria-label={ui.lunaUrmatoare}>
          <Icon name="arrow" marime="sm" />
        </button>
      </div>

      <div className="cal-luni">
        <Luna an={ancora.an} luna={ancora.luna} ui={ui} checkIn={checkIn} checkOut={checkOut} minim={minim} onAlege={alege} />
        <Luna
          an={urm.getFullYear()}
          luna={urm.getMonth()}
          ui={ui}
          checkIn={checkIn}
          checkOut={checkOut}
          minim={minim}
          onAlege={alege}
        />
      </div>
    </div>
  )
}

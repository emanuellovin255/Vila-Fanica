import { Fragment } from 'react'

import {
  Antet,
  BlocRezervare,
  BaraLipita,
  Hero,
  Inchidere,
  Subsol,
} from '@/components/sectiuni'
import { sectiune } from '@/components/sectiuni/dispecer'
import { pret } from '@/lib/format'
import type { PropsSablon } from '@/lib/sablon'
import type { SiteData } from '@/content/types'

import { GalerieEditoriala } from './GalerieEditoriala'

/**
 * Șablonul 3 · Galerie editorială + rezervare lipită (T22).
 *
 * Pentru cabane, chalet-uri, locații spectaculoase — unde poza vinde.
 * Construit în jurul galeriei, cu rezervarea la un click distanță în
 * orice moment: un rail lipit pe desktop, bara de jos pe mobil.
 *
 * Doar layout și skin. Galeria editorială (masonry + lightbox + swipe)
 * e specifică acestui șablon, deci trăiește aici (REGULI.md 1); restul
 * secțiunilor și bara de disponibilitate vin din motor.
 */

/** Strânge pozele reale din date pentru galerie, cu alt-ul lor. Fără
 *  poze (ca în demo, fără media), galeria pur și simplu nu apare. */
function adunaGalerie(date: SiteData): { imagini: string[]; titluri: string[] } {
  const imagini: string[] = []
  const titluri: string[] = []
  const adauga = (src?: string, alt?: string) => {
    if (src && !imagini.includes(src)) {
      imagini.push(src)
      titluri.push(alt ?? '')
    }
  }
  for (const c of date.rooms.items) {
    adauga(c.image, c.name)
    c.images?.forEach((im) => adauga(im, c.name))
  }
  for (const f of date.features) adauga(f.image, f.title)
  for (const o of date.offers.items) adauga(o.image, o.title)
  return { imagini, titluri }
}

/** Rail-ul de rezervare: preț „de la" mereu vizibil + bara de
 *  disponibilitate, stivuită vertical prin skin. Prețul se calculează
 *  din camere, nu se scrie; lipsește dacă nicio cameră n-are tarif
 *  confirmat (REGULI.md 3). */
function RailRezervare({ date }: { date: SiteData }) {
  const preturi = date.rooms.items
    .map((c) => c.priceFrom)
    .filter((p): p is number => typeof p === 'number')
  const minim = preturi.length ? Math.min(...preturi) : undefined

  return (
    <aside className="rail" aria-label={date.booking.labels.submit}>
      <div className="rail-card">
        {minim !== undefined && (
          <p className="rail-pret">
            <small>{date.booking.labels.from}</small>
            <b className="tabular">{pret(minim, date.meta.currencySymbol)}</b>
            <small>/ {date.booking.labels.perNight}</small>
          </p>
        )}
        <BlocRezervare date={date} />
      </div>
    </aside>
  )
}

export function SablonGalerieRezervare({ date, setari, meniu }: PropsSablon) {
  const ctx = { date, meniu }
  const galerie = adunaGalerie(date)

  // Închiderea rămâne mereu pe toată lățimea, sub layout-ul cu rail —
  // nu în coloana îngustă (are fundal de brand, plin).
  const inColoana = setari.sectiuni.filter((id) => id !== 'closing')

  return (
    <div className="skin-galerie">
      <Antet date={date} />

      <main>
        <Hero date={date} />

        <div className="wrap galerie-layout">
          <div className="galerie-col">
            <GalerieEditoriala
              imagini={galerie.imagini}
              titluri={galerie.titluri}
              eyebrow={date.ui.galerieTitlu}
              titlu={date.ui.galerieSubtitlu}
              ui={date.ui}
            />

            {inColoana.map((id) => (
              <Fragment key={id}>{sectiune(id, ctx)}</Fragment>
            ))}
          </div>

          <RailRezervare date={date} />
        </div>

        <Inchidere date={date} />
      </main>

      <Subsol date={date} />
      <BaraLipita date={date} />
    </div>
  )
}

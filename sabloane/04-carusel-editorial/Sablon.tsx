import { Fragment } from 'react'

import { Antet, BaraLipita, BlocRezervare, Inchidere, Subsol } from '@/components/sectiuni'
import { sectiune } from '@/components/sectiuni/dispecer'
import type { PropsSablon } from '@/lib/sablon'

import { HeroCarusel } from './HeroCarusel'

/**
 * Șablonul 4 · Carusel editorial (T-Delta).
 *
 * Pentru resorturi și locații cu multe fotografii bune, dar fără video:
 * cazul în care o singură poză de sus nu poate spune ce e locul. Aici
 * sunt trei lucruri diferite de vândut — apa Deltei, spa-ul, restaurantul
 * — iar un hero static ar fi trebuit să aleagă unul și să-l piardă pe
 * ceilalți doi.
 *
 * SEMNĂTURA: caruselul pe tot ecranul, în care fiecare cadru își poartă
 * titlul și subtitlul lui, cu antetul transparent peste el. Bara de
 * disponibilitate stă suprapusă pe marginea de jos, ca la Șablonul 1 —
 * primul lucru pe care-l vede vizitatorul după titlu, fără scroll.
 *
 * Doar layout și skin: singura logică proprie e `HeroCarusel`, care e
 * specific șablonului ăstuia, deci trăiește aici (REGULI.md 1). Restul
 * secțiunilor vin din motor, în ordinea din `setari.sectiuni`, prin
 * același dispecer ca la celelalte trei șabloane.
 */
export function SablonCaruselEditorial({ date, setari, meniu }: PropsSablon) {
  const ctx = { date, meniu }
  const areInchidere = setari.sectiuni.includes('closing')

  return (
    <div className="skin-carusel">
      <Antet date={date} />

      <main id="continut">
        <HeroCarusel date={date} />

        {/* Bara de disponibilitate, trasă peste marginea de jos a
            caruselului (skin.css). `#rezervare` rămâne ancora pentru
            butonul din antet și pentru bara mobilă. Se stinge cu
            „Bloc de rezervare: nu" în `setari.md`. */}
        {setari.blocRezervare && (
          <div className="hero-booking-wrap">
            <BlocRezervare date={date} />
          </div>
        )}

        {setari.sectiuni.map((id) => (
          <Fragment key={id}>{sectiune(id, ctx)}</Fragment>
        ))}

        {/* Pagina nu se termină niciodată cu o secțiune informativă: dacă
            gazda a scos „Secțiune de închidere" din setari.md, o punem
            oricum, ca ultimul ecran să ceară totuși rezervarea. */}
        {!areInchidere && <Inchidere date={date} />}
      </main>

      <Subsol date={date} />
      <BaraLipita date={date} />
    </div>
  )
}

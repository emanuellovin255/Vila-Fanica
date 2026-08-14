import { Fragment } from 'react'

import { Antet, BaraLipita, BlocRezervare, Inchidere, Subsol } from '@/components/sectiuni'
import { sectiune } from '@/components/sectiuni/dispecer'
import type { PropsSablon } from '@/lib/sablon'

import { HeroVideo } from './HeroVideo'

/**
 * Șablonul 1 · Hero Video (T20).
 *
 * Pentru resorturi mari, hoteluri 4–5*, spa — locațiile cu footage bun.
 * Semnătura: video de fundal la ecran plin, cu bara de disponibilitate
 * suprapusă pe marginea de jos a hero-ului — primul lucru pe care îl
 * vede vizitatorul după titlu, fără scroll (alegerea de conversie, T20).
 *
 * Doar layout și skin: nicio logică proprie în afară de `HeroVideo`
 * (care e specific șablonului ăstuia, deci stă aici — REGULI.md 1).
 * Restul secțiunilor vin din motor, în ordinea din `setari.sectiuni`.
 */
export function SablonHeroVideo({ date, setari, meniu }: PropsSablon) {
  const ctx = { date, meniu }
  const areInchidere = setari.sectiuni.includes('closing')

  return (
    <div className="skin-hero-video">
      <Antet date={date} />

      <main id="continut">
        <HeroVideo date={date} />

        {/* Bara de disponibilitate, suprapusă pe marginea de jos a
            hero-ului (skin.css o trage în sus). `#rezervare` rămâne
            ancora pentru butonul din antet și pentru bara mobilă.
            Se stinge cu „Bloc de rezervare: nu" în `setari.md`. */}
        {setari.blocRezervare && (
          <div className="hero-booking-wrap">
            <BlocRezervare date={date} />
          </div>
        )}

        {setari.sectiuni.map((id) => (
          <Fragment key={id}>{sectiune(id, ctx)}</Fragment>
        ))}

        {!areInchidere && <Inchidere date={date} />}
      </main>

      <Subsol date={date} />
      <BaraLipita date={date} />
    </div>
  )
}

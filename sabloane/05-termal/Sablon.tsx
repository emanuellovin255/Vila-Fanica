import { Fragment } from 'react'

import { Antet, BaraLipita, BlocRezervare, Inchidere, Subsol } from '@/components/sectiuni'
import { sectiune } from '@/components/sectiuni/dispecer'
import type { PropsSablon } from '@/lib/sablon'

import { BandaDotari } from './BandaDotari'
import { CifreCrescatoare } from './CifreCrescatoare'
import { HeroTermal } from './HeroTermal'

/**
 * Șablonul 5 · Termal — construit pentru Pensiunea Casa Drăgan.
 *
 * DE CE EXISTĂ, când motorul avea deja patru șabloane (tasks/T02):
 * locația are UN singur argument de vânzare, nu trei. E nouă, e curată și
 * e la 600 de metri de Aquapark President. Șablonul 4 (carusel) presupune
 * mai multe lucruri de vândut deodată și ar fi rotit aceeași clădire din
 * patru unghiuri; șablonul 3 (galerie masonry) ar fi pierdut cele cinci
 * cadre de dronă printre patruzeci de poze de cameră care seamănă între
 * ele; șablonul 1 cere un clip video, iar filmările lor sunt pe YouTube,
 * care nu poate rămâne pe site (REGULI.md 9).
 *
 * Semnătura: un singur cadru de dronă la ecran plin, ținut într-o mișcare
 * Ken Burns de 24 de secunde, apoi banda de dotări reale și drumul în jos
 * prin camere și curte.
 *
 * Doar layout și skin. Singura logică proprie stă în cele trei componente
 * din folderul ăsta (REGULI.md 1), iar dintre ele una singură are
 * JavaScript — numărătoarea din banda de încredere, strict decorativă.
 * Restul secțiunilor vin din motor, în ordinea din `setari.sectiuni`.
 */
export function SablonTermal({ date, setari, meniu }: PropsSablon) {
  const ctx = { date, meniu }
  const areInchidere = setari.sectiuni.includes('closing')

  return (
    <div className="skin-termal">
      <Antet date={date} />

      <main id="continut">
        <HeroTermal date={date} />

        {/* Bara de disponibilitate, suprapusă pe marginea de jos a
            hero-ului (skin.css o trage în sus). `#rezervare` rămâne
            ancora pentru butonul din antet și pentru bara mobilă.
            Se stinge cu „Bloc de rezervare: nu" în `setari.md`. */}
        {setari.blocRezervare && (
          <div className="hero-booking-wrap">
            <BlocRezervare date={date} />
          </div>
        )}

        {/* Dotările reale, în mișcare lentă. Fără facilități scrise în
            `date/05-facilitati.md`, componenta întoarce null singură. */}
        <BandaDotari date={date} />

        {setari.sectiuni.map((id) => (
          <Fragment key={id}>{sectiune(id, ctx)}</Fragment>
        ))}

        {!areInchidere && <Inchidere date={date} />}
      </main>

      <Subsol date={date} />
      <BaraLipita date={date} />

      {/* Se montează doar dacă banda de încredere e chiar în pagină.
          Nu randează nimic; fără el, cifrele sunt oricum acolo. */}
      {setari.sectiuni.includes('trust') && <CifreCrescatoare />}
    </div>
  )
}

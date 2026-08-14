import { Fragment } from 'react'

import { Antet, BaraLipita, BlocRezervare, Inchidere, Subsol } from '@/components/sectiuni'
import { sectiune } from '@/components/sectiuni/dispecer'
import type { PropsSablon } from '@/lib/sablon'

import { HeroIrlandez } from './HeroIrlandez'
import { MarchizaCamere } from './MarchizaCamere'
import { CifreCrescatoare } from './CifreCrescatoare'

/**
 * Șablonul 6 · Irlandez — construit pentru Casa Irlandeză, Băile Felix.
 *
 * DE CE EXISTĂ, când motorul avea deja cinci șabloane: cerința a fost
 * „stil irlandez, în stilul lui zagazaga.ro". Cele cinci existente sunt
 * toate aranjamente de pensiune românească — titluri la corp mediu,
 * carduri rotunjite, fundal alb. Niciunul nu dă limbajul cerut.
 *
 * Ce e propriu șablonului ăstuia, și nu se găsește în celelalte:
 *
 *   1 · titluri uriașe, în MAJUSCULE, la un font de afiș (Anton)
 *   2 · fundal de hârtie, cu textură fină, și MARGINI RUPTE între secțiuni
 *   3 · grila de CERCURI pentru facilități — semnătura vizuală
 *   4 · o bandă cu numele camerelor, în mișcare lentă
 *
 * Doar layout și skin. Singura logică proprie stă în cele trei componente
 * din folderul ăsta (REGULI.md 1), iar dintre ele una singură are
 * JavaScript — numărătoarea din banda de încredere, strict decorativă.
 * Restul secțiunilor vin din motor, în ordinea din `setari.sectiuni`.
 *
 * MARGINILE RUPTE sunt desenate cu `mask-image` peste un SVG inline, în
 * `skin.css` — nu sunt fișiere de imagine. Se aplică doar între secțiunea
 * întunecată și cea de hârtie, unde chiar se văd; puse peste tot, ar fi
 * devenit un manierism.
 */
export function SablonIrlandez({ date, setari, meniu }: PropsSablon) {
  const ctx = { date, meniu }
  const areInchidere = setari.sectiuni.includes('closing')

  return (
    <div className="skin-irlandez">
      <Antet date={date} />

      <main id="continut">
        <HeroIrlandez date={date} />

        {/* Bara de disponibilitate, suprapusă peste marginea de jos a
            hero-ului (skin.css o trage în sus). `#rezervare` rămâne
            ancora pentru butonul din antet și pentru bara mobilă.
            Se stinge cu „Bloc de rezervare: nu" în `setari.md`. */}
        {setari.blocRezervare && (
          <div className="hero-booking-wrap">
            <BlocRezervare date={date} />
          </div>
        )}

        {/* Numele celor trei camere, în mișcare lentă. Ține locul unei
            secțiuni întregi de „ce oferim" și e primul lucru de sub
            bara de rezervare, unde omul tocmai s-a întrebat ce are casa.
            Fără camere scrise, componenta întoarce null singură. */}
        <MarchizaCamere date={date} />

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
